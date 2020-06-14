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
    return {
      type,
      fromTableName: _.snakeCase(this.parentEntityType),
      toTableName: _.snakeCase(type),
      methodReadyName: _.upperFirst(name),
      methodReadyInverseName: _.upperFirst(inverseName),
      inverseIdColumnName: `${_.snakeCase(inverseName)}_id`,
    };
  })();

  /**
   * Builds a whereHas* method that does a where-relation-exists query.
   */
  private buildWhereHasRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      type,
      fromTableName,
      toTableName,
      methodReadyName,
      inverseIdColumnName,
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
          .addLine(`"${fromTableName}.id",`)
          .addLine(
            `relationQuery.queryBuilder.client.ref("${toTableName}.${inverseIdColumnName}")`
          )
          .addLine(")")
          .addLine(");")
          .addLine("return this;")
      );
  }

  // TODO:
  // whereRelation (= join)
  // TODO: withRelation (= left join)
  // withComments(
  //   builder: (query: CommentQuery) => CommentQuery = (query) => query
  // ): this {
  //   const relationQuery = builder(new CommentQuery(this.vc));
  //   this.queryBuilder.join(
  //     // TODO: Ensure unique label
  //     // TODO: Fix ambiguous id column; generate aliases and store on query? Can also supply depth
  //     relationQuery.queryBuilder.as("comments"),
  //     (joinClause) => joinClause.on("comments.post_id", "=", "id")
  //   );
  //   return this;
  // }

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
    this.buildWhereHasRelationMethod(codeBuilder).addLine();
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
