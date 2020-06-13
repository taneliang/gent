import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { ManyToOneRelationBasedGenerator } from "./ManyToOneRelationBasedGenerator";

/**
 * Generates code for a many to one edge in a *Loader class.
 */
export class LoaderManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  private processedSpecification = (() => {
    const {
      toOne: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);
    return { name, type, methodReadyName };
  })();

  private buildLoadRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
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

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    this.buildLoadRelationMethod(codeBuilder);
    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const { type } = this.processedSpecification;
    return {
      [`../${type}/${type}Loader`]: [`${type}Loader`],
    };
  }
}
