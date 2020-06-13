import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { OneToManyRelationBasedGenerator } from "./OneToManyRelationBasedGenerator";

/**
 * Generates code for a one to many edge in a *Query class.
 */
export class QueryOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      fromOne: { inverseName },
      toMany: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const methodReadyInverseName = _.upperFirst(inverseName);

    return codeBuilder.addBlock(
      `query${methodReadyName}(): ${type}Query`,
      (b) =>
        b
          .addBlock(
            `return new ${type}Query(this.vc, async (childQuery) =>`,
            (b) =>
              b.addLine(
                `childQuery.where${methodReadyInverseName}IdIn(await this.getIds());`
              )
          )
          .addLine(");")
    );
  }

  importsRequired(): ImportMap {
    const {
      toMany: { type },
    } = this.specification;
    return {
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
