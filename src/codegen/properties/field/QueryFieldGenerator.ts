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

  private buildAllStringFieldMethods(codeBuilder: CodeBuilder): CodeBuilder {
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
    return this.buildAllGenericFieldMethods(codeBuilder);
  }

  private buildWhereEqualsMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { type, methodReadyName, idReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `where${methodReadyName}Equals(value: ${type}): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.where('${idReadyName}', value);`)
          .addLine("return this;")
    );
  }

  private buildWhereInMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { type, methodReadyName, idReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `where${methodReadyName}In(values: ${type}[]): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.whereIn('${idReadyName}', values);`)
          .addLine("return this;")
    );
  }

  private buildWhereIsNullMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { methodReadyName, idReadyName } = this.processedSpecification;
    return codeBuilder
      .addBlock(`where${methodReadyName}IsNull(): this`, (b) =>
        b
          .addLine(`this.queryBuilder.whereNull('${idReadyName}');`)
          .addLine("return this;")
      )
      .addLine()
      .addBlock(`where${methodReadyName}IsNotNull(): this`, (b) =>
        b
          .addLine(`this.queryBuilder.whereNotNull('${idReadyName}');`)
          .addLine("return this;")
      );
  }

  private buildGetAllMethod(codeBuilder: CodeBuilder): CodeBuilder {
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
