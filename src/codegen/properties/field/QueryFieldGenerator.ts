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
    return {
      name,
      type,
      nullable,
      methodReadyName: _.upperFirst(name),
      columnName: _.snakeCase(name),
    };
  })();

  private buildAllStringFieldMethods(codeBuilder: CodeBuilder): CodeBuilder {
    const { methodReadyName, columnName } = this.processedSpecification;
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
          .addLine(`this.queryBuilder.where('${columnName}', 'LIKE', pattern);`)
          .addLine("return this;")
      )
      .addLine();
    return this.buildAllGenericFieldMethods(codeBuilder);
  }

  private buildWhereEqualsMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { type, methodReadyName, columnName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `where${methodReadyName}Equals(value: ${type}): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.where('${columnName}', value);`)
          .addLine("return this;")
    );
  }

  private buildWhereInMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { type, methodReadyName, columnName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `where${methodReadyName}In(values: ${type}[]): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.whereIn('${columnName}', values);`)
          .addLine("return this;")
    );
  }

  private buildWhereIsNullMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { methodReadyName, columnName } = this.processedSpecification;
    return codeBuilder
      .addBlock(`where${methodReadyName}IsNull(): this`, (b) =>
        b
          .addLine(`this.queryBuilder.whereNull('${columnName}');`)
          .addLine("return this;")
      )
      .addLine()
      .addBlock(`where${methodReadyName}IsNotNull(): this`, (b) =>
        b
          .addLine(`this.queryBuilder.whereNotNull('${columnName}');`)
          .addLine("return this;")
      );
  }

  private buildGetAllMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      name,
      type,
      nullable,
      methodReadyName,
      columnName,
    } = this.processedSpecification;
    const returnType = nullable ? `(${type} | undefined)` : type;
    return codeBuilder.addBlock(
      `async get${methodReadyName}s(): Promise<${returnType}[]>`,
      (b) =>
        b
          .addLine("await this.applyGraphViewRestrictions();")
          .addLine(
            `const finalQb = this.queryBuilder.clone().clearSelect().select("${columnName}");`
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

  private buildAllGenericFieldMethods(codeBuilder: CodeBuilder): CodeBuilder {
    // TODO: Implement comparables?
    // where*IsBetween
    // where*IsGreaterThan
    // where*IsGreaterThanOrEqual
    // where*IsLessThan
    // where*IsLessThanOrEqual
    const { nullable } = this.processedSpecification;

    this.buildWhereEqualsMethod(codeBuilder).addLine();
    this.buildWhereInMethod(codeBuilder).addLine();

    if (nullable) {
      this.buildWhereIsNullMethod(codeBuilder).addLine();
    }

    this.buildGetAllMethod(codeBuilder);
    return codeBuilder;
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { type } = this.specification;
    switch (type) {
      case "string":
        return this.buildAllStringFieldMethods(codeBuilder);
      default:
        return this.buildAllGenericFieldMethods(codeBuilder);
    }
  }

  importsRequired(): ImportMap {
    return { "mikro-orm": ["EntityData"] };
  }
}
