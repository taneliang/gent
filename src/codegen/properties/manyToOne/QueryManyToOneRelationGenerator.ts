import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { ManyToOneRelationBasedGenerator } from "./ManyToOneRelationBasedGenerator";

/**
 * Generates code for a many to one edge in a *Query class.
 */
export class QueryManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  private buildRelationIdsInMethod(
    codeBuilder: CodeBuilder,
    methodReadyName: string,
    idReadyName: string
  ): CodeBuilder {
    return codeBuilder.addBlock(
      `where${methodReadyName}IdsIn(ids: number[]): this`,
      (b) =>
        b
          .addLine(`this.queryBuilder.whereIn('${idReadyName}', ids);`)
          .addLine("return this;")
    );
  }

  private buildQueryRelationMethod(
    codeBuilder: CodeBuilder,
    type: string,
    methodReadyName: string
  ): CodeBuilder {
    return codeBuilder.addBlock(
      `query${methodReadyName}(): ${type}Query`,
      (b) =>
        b
          .addBlock(
            `return new ${type}Query(this.vc, async (childQuery) =>`,
            (b) =>
              b.addLine(
                `childQuery.whereIdsIn(await this.get${methodReadyName}Ids());`
              )
          )
          .addLine(");")
    );
  }

  private buildGetRelationIdsMethod(
    codeBuilder: CodeBuilder,
    name: string,
    methodReadyName: string,
    idReadyName: string
  ): CodeBuilder {
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
    const {
      toOne: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const idReadyName = `${_.snakeCase(name)}_id`;

    this.buildRelationIdsInMethod(
      codeBuilder,
      methodReadyName,
      idReadyName
    ).addLine();

    this.buildQueryRelationMethod(codeBuilder, type, methodReadyName).addLine();

    this.buildGetRelationIdsMethod(
      codeBuilder,
      name,
      methodReadyName,
      idReadyName
    );

    return codeBuilder;
  }

  importsRequired(): ImportMap {
    const {
      toOne: { type },
    } = this.specification;
    return {
      "mikro-orm": ["EntityData"],
      lodash: ["uniq"],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
