import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { OneToOneRelationBasedGenerator } from "./OneToOneRelationBasedGenerator";

/**
 * Generates code for a one to one edge in a *Loader class.
 */
export class LoaderOneToOneRelationGenerator extends OneToOneRelationBasedGenerator {
  private processedSpecification = (() => {
    const {
      fromOne: { inverseName, owner },
      toOne: { name, type },
    } = this.specification;
    return {
      name,
      type,
      owner,
      methodReadyName: _.upperFirst(name),
      inverseName,
      inverseIdColumnName: `${_.snakeCase(inverseName)}_id`,
    };
  })();

  private buildLoadRelationMethodForOwner(
    codeBuilder: CodeBuilder
  ): CodeBuilder {
    const { name, type, methodReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `load${methodReadyName}(): ${type}Loader`,
      (b) =>
        b
          .addBlock(
            `return new ${type}Loader(this.vc, async (childLoader) =>`,
            (b) =>
              b
                .addLine("const selves = await this.getAll();")
                .addLine("childLoader.onlyIds(")
                .addLine("selves")
                .addLine("// TODO: Handle errors better")
                .addLine(
                  `.map((self) => (self instanceof Error ? undefined : self?.${name}.id))`
                )
                .addLine(".filter((self) => self !== undefined) as number[],")
                .addLine(");")
          )
          .addLine(");")
    );
  }

  private buildLoadRelationMethodForOwned(
    codeBuilder: CodeBuilder
  ): CodeBuilder {
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
                  `const entityErrorOrUndefineds = await this.get${methodReadyName}();`
                )
                .addLine("const entityIds = entityErrorOrUndefineds")
                .addLine("// TODO: Handle errors better")
                .addLine(
                  `.filter((entityErrorOrUndefined) => entityErrorOrUndefined instanceof ${type})`
                )
                .addLine(`.map((entity) => entity as ${type})`)
                .addLine(".map((entity) => entity.id);")
                .addLine("childLoader.onlyIds(entityIds);")
          )
          .addLine(");")
    );
  }

  private buildGetRelationMethodForOwned(
    codeBuilder: CodeBuilder
  ): CodeBuilder {
    const {
      type,
      methodReadyName,
      inverseName,
      inverseIdColumnName,
    } = this.processedSpecification;
    return codeBuilder.addBlock(
      `async get${methodReadyName}(): Promise<(${type} | Error | undefined)[]>`,
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
          .addLine(".loadManyWithOneEntityEach(this.ids);")
    );
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { owner } = this.processedSpecification;
    if (owner) {
      this.buildLoadRelationMethodForOwner(codeBuilder);
    } else {
      this.buildLoadRelationMethodForOwned(codeBuilder).addLine();
      this.buildGetRelationMethodForOwned(codeBuilder);
    }
    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const { type, owner } = this.processedSpecification;
    if (owner) {
      return {
        [`../${type}/${type}Loader`]: [`${type}Loader`],
      };
    } else {
      return {
        [`../${type}/${type}`]: [type],
        [`../${type}/${type}Loader`]: [`${type}Loader`],
        [`../${type}/${type}Query`]: [`${type}Query`],
      };
    }
  }
}
