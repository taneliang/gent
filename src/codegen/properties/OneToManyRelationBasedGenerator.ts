import { OneToManyOptions } from "mikro-orm";
import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { PropertyBasedGenerator } from "./PropertyBasedGenerator";
import { OneToManySpecification } from "../..";
import { ImportMap } from "../ImportMap";

/**
 * A base generator class for a one to many edge.
 */
abstract class OneToManyRelationBasedGenerator extends PropertyBasedGenerator<
  OneToManySpecification
> {}

/**
 * Generates code for a one to many property in a database entity class.
 */
export class ModelOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  generateOptionsString(): string {
    const propertyOptions: OneToManyOptions<never> = _.pick(
      this.specification.toMany,
      ["nullable", "unique"]
    );
    return _.isEmpty(propertyOptions) ? "" : JSON.stringify(propertyOptions);
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      fromOne: { inverseName },
      toMany: { name, type },
    } = this.specification;
    return codeBuilder
      .addLine(
        `@OneToMany(() => ${type}, (e) => e.${inverseName}, ${this.generateOptionsString()})`
      )
      .addLine(`${name} = new Collection<${type}>(this);`);
  }

  importsRequired(): ImportMap {
    const {
      toMany: { type },
    } = this.specification;
    return {
      "mikro-orm": ["Collection", "OneToMany"],
      [`../${type}/${type}`]: [type],
    };
  }
}

/**
 * Generates code for a one to many edge in a *Loader class.
 */
export class LoaderOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      fromOne: { inverseName },
      toMany: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const idReadyInverseName = `${_.snakeCase(inverseName)}_id`;

    return codeBuilder
      .addBlock(`load${methodReadyName}(): ${type}Loader`, (b) =>
        b
          .addBlock(
            `return new ${type}Loader(this.vc, async (childLoader) =>`,
            (b) =>
              b
                .addLine(
                  `const entitiesOrErrors = await this.get${methodReadyName}();`
                )
                .addLine("const entityIds = entitiesOrErrors")
                .addLine("// TODO: Handle errors better")
                .addLine(
                  ".filter((entitiesOrError) => entitiesOrError instanceof Array)"
                )
                .addLine(`.flatMap((entities) => entities as ${type}[])`)
                .addLine(".map((entity) => entity.id);")
                .addLine("childLoader.onlyIds(entityIds);")
          )
          .addLine(");")
      )
      .addLine()
      .addBlock(
        `async get${methodReadyName}(): Promise<(${type}[] | Error)[]>`,
        (b) =>
          b
            .addLine("return this.vc.beltalowdas")
            .addBlock(
              `.beltalowdaForModel(${type}, '${idReadyInverseName}', () =>`,
              (b) =>
                b
                  .addLine("return new Beltalowda(")
                  .addLine("this.vc,")
                  .addLine(`() => new ${type}Query(this.vc),`)
                  .addLine(`'${idReadyInverseName}',`)
                  .addLine(`(model) => model.${inverseName}.id,`)
                  .addLine(");")
            )
            .addLine(")")
            .addLine(".loadManyWithManyEntitiesEach(this.ids);")
      );
  }

  importsRequired(): ImportMap {
    const {
      toMany: { type },
    } = this.specification;
    return {
      [`../${type}/${type}`]: [type],
      [`../${type}/${type}Loader`]: [`${type}Loader`],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}

/**
 * Generates code for a one to many edge in a *Query class.
 */
export class QueryOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      fromOne: { inverseName },
      toMany: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const methodReadyInverseName = _.upperFirst(inverseName);

    return codeBuilder.addBlock(
      `query${methodReadyName}(): ${type}Query`,
      (b) =>
        b
          .addBlock(
            `return new ${type}Query(this.vc, async (childQuery) =>`,
            (b) =>
              b.addLine(
                `childQuery.where${methodReadyInverseName}IdsIn(await this.getIds());`
              )
          )
          .addLine(");")
    );
  }

  importsRequired(): ImportMap {
    const {
      toMany: { type },
    } = this.specification;
    return {
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
