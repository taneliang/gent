import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { OneToOneRelationBasedGenerator } from "./OneToOneRelationBasedGenerator";

/**
 * Generates code for a one to one edge in a *Query class.
 */
export class QueryOneToOneRelationGenerator extends OneToOneRelationBasedGenerator {
  private processedSpecification = (() => {
    const {
      fromOne: { inverseName, owner },
      toOne: { name, type },
    } = this.specification;
    return {
      name,
      type,
      owner,
      fromTableName: _.snakeCase(this.parentEntityType),
      toTableName: _.snakeCase(type),
      methodReadyName: _.upperFirst(name),
      relationIdColumnName: `${_.snakeCase(name)}_id`,
      methodReadyInverseName: _.upperFirst(inverseName),
      inverseIdColumnName: `${_.snakeCase(inverseName)}_id`,
    };
  })();

  private buildRelationIdInMethodForOwner(
    codeBuilder: CodeBuilder
  ): CodeBuilder {
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

  /**
   * Builds a whereHas* method that does a where-relation-exists query.
   */
  private buildWhereHasRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      type,
      owner,
      fromTableName,
      toTableName,
      methodReadyName,
      relationIdColumnName,
      inverseIdColumnName,
    } = this.processedSpecification;
    return codeBuilder
      .addLine(`whereHas${methodReadyName}(`)
      .addLine(
        `builder: (query: ${type}Query) => ${type}Query = (query) => query,`
      )
      .addBlock("): this", (b) => {
        b.addLine(`const relationQuery = builder(new ${type}Query(this.vc));`)
          .addLine("this.queryBuilder.whereExists(")
          .addLine("relationQuery.queryBuilder.where(");

        // TODO: Ensure unique aliases
        if (owner) {
          b.addLine(`"${fromTableName}.${relationIdColumnName}",`).addLine(
            `relationQuery.queryBuilder.client.ref("${toTableName}.id")`
          );
        } else {
          b.addLine(`"${fromTableName}.id",`).addLine(
            `relationQuery.queryBuilder.client.ref("${toTableName}.${inverseIdColumnName}")`
          );
        }

        b.addLine(")").addLine(");").addLine("return this;");
        return b;
      });
  }

  private buildQueryRelationMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      type,
      owner,
      methodReadyName,
      methodReadyInverseName,
    } = this.processedSpecification;
    return codeBuilder.addBlock(
      `query${methodReadyName}(): ${type}Query`,
      (b) =>
        b
          .addBlock(
            `return new ${type}Query(this.vc, async (childQuery) =>`,
            (b) => {
              if (owner) {
                b.addLine(
                  `childQuery.whereIdIn(await this.get${methodReadyName}Ids());`
                );
              } else {
                b.addLine(
                  `childQuery.where${methodReadyInverseName}IdIn(await this.getIds());`
                );
              }
              return b;
            }
          )
          .addLine(");")
    );
  }

  private buildGetRelationIdsMethodForOwner(
    codeBuilder: CodeBuilder
  ): CodeBuilder {
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
    const { owner } = this.processedSpecification;
    if (owner) {
      this.buildRelationIdInMethodForOwner(codeBuilder).addLine();
    }
    this.buildWhereHasRelationMethod(codeBuilder).addLine();
    this.buildQueryRelationMethod(codeBuilder);
    if (owner) {
      codeBuilder.addLine();
      this.buildGetRelationIdsMethodForOwner(codeBuilder);
    }
    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const { type, owner } = this.processedSpecification;
    if (owner) {
      return {
        "@elg/gent": ["GentModelData"],
        lodash: ["uniq"],
        [`../${type}/${type}Query`]: [`${type}Query`],
      };
    } else {
      return {
        [`../${type}/${type}Query`]: [`${type}Query`],
      };
    }
  }
}
