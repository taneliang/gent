import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { ManyToOneRelationBasedGenerator } from "./ManyToOneRelationBasedGenerator";

/**
 * Generates code for a many to one edge in a *Loader class.
 */
export class LoaderManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      toOne: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);

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

  importsRequired(): ImportMap {
    const {
      toOne: { type },
    } = this.specification;
    return {
      [`../${type}/${type}Loader`]: [`${type}Loader`],
    };
  }
}
