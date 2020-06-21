import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { ManyToOneRelationBasedGenerator } from "./ManyToOneRelationBasedGenerator";

/**
 * Generates code for a many to one edge in a *Query class.
 */
export class QueryManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  private processedSpecification = (() => {
    const {
      toOne: { name, type },
    } = this.specification;
    return {
      name,
      type,
      fromTableName: _.snakeCase(this.parentEntityType),
      toTableName: _.snakeCase(type),
      methodReadyName: _.upperFirst(name),
      relationIdColumnName: `${_.snakeCase(name)}_id`,
    };
  })();

  private buildRelationIdInMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      methodReadyName,
      relationIdColumnName,
    } = this.processedSpecification;
    return codeBuilder.addBlock(
      `where${methodReadyName}IdIn(ids: number[]): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.whereIn('${relationIdColumnName}', ids);`)
          .addLine("return this;")
    );
  }

  private buildWhereHasRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      type,
      fromTableName,
      toTableName,
      methodReadyName,
      relationIdColumnName,
    } = this.processedSpecification;
    return codeBuilder
      .addLine(`whereHas${methodReadyName}(`)
      .addLine(
        `builder: (query: ${type}Query) => ${type}Query = (query) => query,`
      )
      .addBlock("): this", (b) =>
        b
          .addLine(`const relationQuery = builder(new ${type}Query(this.vc));`)
          .addLine("this.queryBuilder.whereExists(")
          .addLine("relationQuery.queryBuilder.where(")
          // TODO: Ensure unique aliases
          .addLine(`"${fromTableName}.${relationIdColumnName}",`)
          .addLine(`relationQuery.queryBuilder.client.ref("${toTableName}.id")`)
          .addLine(")")
          .addLine(");")
          .addLine("return this;")
      );
  }

  private buildQueryRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { type, methodReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `query${methodReadyName}(): ${type}Query`,
      (b) =>
        b
          .addBlock(
            `return new ${type}Query(this.vc, async (childQuery) =>`,
            (b) =>
              b.addLine(
                `childQuery.whereIdIn(await this.get${methodReadyName}Ids());`
              )
          )
          .addLine(");")
    );
  }

  private buildGetRelationIdsMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      name,
      methodReadyName,
      relationIdColumnName,
    } = this.processedSpecification;
    return codeBuilder.addBlock(
      `async get${methodReadyName}Ids(): Promise<number[]>`,
      (b) =>
        b
          .addLine("const finalQb = this.queryBuilder")
          .addLine(".clone()")
          .addLine(".clearSelect()")
          .addLine(`.select('id', '${relationIdColumnName}');`)
          .addLine(
            `const results: GentModelData<${this.parentEntityType}>[] = await this.vc.entityManager`
          )
          .addLine(".getConnection('read')")
          .addLine(".execute(finalQb as never);")
          .addLine("const relatedEntitiesWithIds = results.map((result) =>")
          .addLine("this.vc.entityManager.map(this.entityClass, result),")
          .addLine(");")
          .addLine(
            `return uniq(relatedEntitiesWithIds.flatMap((gent) => gent.${name}.id));`
          )
    );
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    this.buildRelationIdInMethod(codeBuilder).addLine();
    this.buildWhereHasRelationMethod(codeBuilder).addLine();
    this.buildQueryRelationMethod(codeBuilder).addLine();
    this.buildGetRelationIdsMethod(codeBuilder);
    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const { type } = this.processedSpecification;
    return {
      "@elg/gent": ["GentModelData"],
      lodash: ["uniq"],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
