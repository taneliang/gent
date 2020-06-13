import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { OneToManyRelationBasedGenerator } from "./OneToManyRelationBasedGenerator";

/**
 * Generates code for a one to many edge in a *Loader class.
 */
export class LoaderOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  private buildLoadRelationMethod(
    codeBuilder: CodeBuilder,
    type: string,
    methodReadyName: string
  ): CodeBuilder {
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

  private buildGetRelationMethod(
    codeBuilder: CodeBuilder,
    type: string,
    methodReadyName: string,
    inverseName: string,
    idReadyInverseName: string
  ): CodeBuilder {
    return codeBuilder.addBlock(
      `async get${methodReadyName}(): Promise<(${type}[] | Error)[]>`,
      (b) =>
        b
          .addLine("return this.vc.beltalowdas")
          .addBlock(
            `.beltalowdaForModel(${type}, '${idReadyInverseName}', () =>`,
            (b) =>
              b
                .addLine("return new Beltalowda(")
                .addLine("this.vc,")
                .addLine(`() => new ${type}Query(this.vc),`)
                .addLine(`'${idReadyInverseName}',`)
                .addLine(`(model) => model.${inverseName}.id,`)
                .addLine(");")
          )
          .addLine(")")
          .addLine(".loadManyWithManyEntitiesEach(this.ids);")
    );
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      fromOne: { inverseName },
      toMany: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const idReadyInverseName = `${_.snakeCase(inverseName)}_id`;

    this.buildLoadRelationMethod(codeBuilder, type, methodReadyName).addLine();

    this.buildGetRelationMethod(
      codeBuilder,
      type,
      methodReadyName,
      inverseName,
      idReadyInverseName
    );

    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const {
      toMany: { type },
    } = this.specification;
    return {
      [`../${type}/${type}`]: [type],
      [`../${type}/${type}Loader`]: [`${type}Loader`],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
