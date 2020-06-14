import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { OneToManyRelationBasedGenerator } from "./OneToManyRelationBasedGenerator";

/**
 * Generates code for a one to many edge in a *Loader class.
 */
export class LoaderOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  private processedSpecification = (() => {
    const {
      fromOne: { inverseName },
      toMany: { name, type },
    } = this.specification;
    return {
      name,
      type,
      methodReadyName: _.upperFirst(name),
      inverseName,
      inverseIdColumnName: `${_.snakeCase(inverseName)}_id`,
    };
  })();

  private buildLoadRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { type, methodReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `load${methodReadyName}(): ${type}Loader`,
      (b) =>
        b
          .addBlock(
            `return new ${type}Loader(this.vc, async (childLoader) =>`,
            (b) =>
              b
                .addLine(
                  `const entitiesOrErrors = await this.get${methodReadyName}();`
                )
                .addLine("const entityIds = entitiesOrErrors")
                .addLine("// TODO: Handle errors better")
                .addLine(
                  ".filter((entitiesOrError) => entitiesOrError instanceof Array)"
                )
                .addLine(`.flatMap((entities) => entities as ${type}[])`)
                .addLine(".map((entity) => entity.id);")
                .addLine("childLoader.onlyIds(entityIds);")
          )
          .addLine(");")
    );
  }

  private buildGetRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      type,
      methodReadyName,
      inverseName,
      inverseIdColumnName,
    } = this.processedSpecification;
    return codeBuilder.addBlock(
      `async get${methodReadyName}(): Promise<(${type}[] | Error)[]>`,
      (b) =>
        b
          .addLine("return this.vc.beltalowdas")
          .addBlock(
            `.beltalowdaForModel(${type}, '${inverseIdColumnName}', () =>`,
            (b) =>
              b
                .addLine("return new Beltalowda(")
                .addLine("this.vc,")
                .addLine(`() => new ${type}Query(this.vc),`)
                .addLine(`'${inverseIdColumnName}',`)
                .addLine(`(model) => model.${inverseName}.id,`)
                .addLine(");")
          )
          .addLine(")")
          .addLine(".loadManyWithManyEntitiesEach(this.ids);")
    );
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    this.buildLoadRelationMethod(codeBuilder).addLine();
    this.buildGetRelationMethod(codeBuilder);
    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const { type } = this.processedSpecification;
    return {
      [`../${type}/${type}`]: [type],
      [`../${type}/${type}Loader`]: [`${type}Loader`],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
