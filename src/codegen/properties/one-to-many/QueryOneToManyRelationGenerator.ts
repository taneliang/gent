import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { OneToManyRelationBasedGenerator } from "./OneToManyRelationBasedGenerator";

/**
 * Generates code for a one to many edge in a *Query class.
 */
export class QueryOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  private processedSpecification = (() => {
    const {
      fromOne: { inverseName },
      toMany: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const methodReadyInverseName = _.upperFirst(inverseName);
    return { type, methodReadyName, methodReadyInverseName };
  })();

  private buildQueryRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      type,
      methodReadyName,
      methodReadyInverseName,
    } = this.processedSpecification;
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

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    this.buildQueryRelationMethod(codeBuilder);
    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const { type } = this.processedSpecification;
    return {
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
