import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { FieldBasedGenerator } from "./FieldBasedGenerator";

/**
 * Generates code for a field in a *Query class.
 */
export class QueryFieldGenerator extends FieldBasedGenerator {
  buildStringFieldLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const idReadyName = _.snakeCase(name);

    // TODO:
    // where*MatchesPattern
    // where*HasPrefix
    // where*HasSuffix
    // where*DoesNotMatchPattern
    // where*DoesNotHavePrefix
    // where*DoesNotHaveSuffix
    return codeBuilder.addBlock(
      `where${methodReadyName}Like(pattern: string): this`,
      (b) =>
        b
          .addLine(
            `this.queryBuilder.where('${idReadyName}', 'LIKE', pattern);`
          )
          .addLine("return this;")
    );
  }

  buildGenericFieldLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const idReadyName = _.snakeCase(name);

    // TODO: Rename where* to where*Is?
    // TODO:
    // where*Exists (nullable only)
    // TODO: Implement comparables?
    // where*IsGreaterThan
    // where*IsGreaterThanOrEqual
    // where*IsLessThan
    // where*IsLessThanOrEqual
    return codeBuilder.addBlock(
      `where${methodReadyName}Eq(value: ${type}): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.where('${idReadyName}', value);`)
          .addLine("return this;")
    );
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { type } = this.specification;

    switch (type) {
      case "string":
        return this.buildStringFieldLines(codeBuilder);
      default:
        return this.buildGenericFieldLines(codeBuilder);
    }
  }

  importsRequired(): ImportMap {
    return {};
  }
}
