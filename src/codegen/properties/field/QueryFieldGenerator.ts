import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { FieldBasedGenerator } from "./FieldBasedGenerator";

/**
 * Generates code for a field in a *Query class.
 */
export class QueryFieldGenerator extends FieldBasedGenerator {
  private processedSpecification = (() => {
    const { name, type, nullable } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const idReadyName = _.snakeCase(name);
    return { name, type, nullable, methodReadyName, idReadyName };
  })();

  private buildAllStringFieldLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { methodReadyName, idReadyName } = this.processedSpecification;
    // TODO:
    // where*MatchesPattern
    // where*HasPrefix
    // where*HasSuffix
    // where*DoesNotMatchPattern
    // where*DoesNotHavePrefix
    // where*DoesNotHaveSuffix
    codeBuilder
      .addBlock(`where${methodReadyName}Like(pattern: string): this`, (b) =>
        b
          .addLine(
            `this.queryBuilder.where('${idReadyName}', 'LIKE', pattern);`
          )
          .addLine("return this;")
      )
      .addLine();
    return this.buildAllGenericFieldLines(codeBuilder);
  }

  private buildWhereEqualsLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { type, methodReadyName, idReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `where${methodReadyName}Equals(value: ${type}): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.where('${idReadyName}', value);`)
          .addLine("return this;")
    );
  }

  private buildWhereInLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { type, methodReadyName, idReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `where${methodReadyName}In(values: ${type}[]): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.whereIn('${idReadyName}', values);`)
          .addLine("return this;")
    );
  }

  private buildGetAllLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      name,
      type,
      nullable,
      methodReadyName,
      idReadyName,
    } = this.processedSpecification;
    const returnType = nullable ? `(${type} | undefined)` : type;
    return codeBuilder.addBlock(
      `async get${methodReadyName}s(): Promise<${returnType}[]>`,
      (b) =>
        b
          .addLine("await this.applyGraphViewRestrictions();")
          .addLine(
            `const finalQb = this.queryBuilder.clone().clearSelect().select("${idReadyName}");`
          )
          .addLine("const results: EntityData<")
          .addLine(`${this.parentEntityType}`)
          .addLine(">[] = await this.vc.entityManager")
          .addLine('.getConnection("read")')
          .addLine(".execute(finalQb as never);")
          .addLine("const resultEntities = results.map((result) =>")
          .addLine("this.vc.entityManager.map(this.entityClass, result)")
          .addLine(");")
          .addLine(`return resultEntities.map((gent) => gent.${name});`)
    );
  }

  private buildAllGenericFieldLines(codeBuilder: CodeBuilder): CodeBuilder {
    // TODO:
    // where*Exists (nullable only)
    // TODO: Implement comparables?
    // where*IsGreaterThan
    // where*IsGreaterThanOrEqual
    // where*IsLessThan
    // where*IsLessThanOrEqual
    this.buildWhereEqualsLines(codeBuilder).addLine();
    this.buildWhereInLines(codeBuilder).addLine();
    this.buildGetAllLines(codeBuilder);
    return codeBuilder;
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { type } = this.specification;
    switch (type) {
      case "string":
        return this.buildAllStringFieldLines(codeBuilder);
      default:
        return this.buildAllGenericFieldLines(codeBuilder);
    }
  }

  importsRequired(): ImportMap {
    return { "mikro-orm": ["EntityData"] };
  }
}
