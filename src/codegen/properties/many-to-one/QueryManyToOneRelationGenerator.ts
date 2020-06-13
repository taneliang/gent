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
    const methodReadyName = _.upperFirst(name);
    const idReadyName = `${_.snakeCase(name)}_id`;
    return { name, type, methodReadyName, idReadyName };
  })();

  private buildRelationIdInMethod(codeBuilder: CodeBuilder): CodeBuilder {
    const { methodReadyName, idReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `where${methodReadyName}IdIn(ids: number[]): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.whereIn('${idReadyName}', ids);`)
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
    const { name, methodReadyName, idReadyName } = this.processedSpecification;
    return codeBuilder.addBlock(
      `async get${methodReadyName}Ids(): Promise<number[]>`,
      (b) =>
        b
          .addLine("const finalQb = this.queryBuilder")
          .addLine(".clone()")
          .addLine(".clearSelect()")
          .addLine(`.select('id', '${idReadyName}');`)
          .addLine(
            `const results: EntityData<${this.parentEntityType}>[] = await this.vc.entityManager`
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
    this.buildQueryRelationMethod(codeBuilder).addLine();
    this.buildGetRelationIdsMethod(codeBuilder);
    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const { type } = this.processedSpecification;
    return {
      "mikro-orm": ["EntityData"],
      lodash: ["uniq"],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
