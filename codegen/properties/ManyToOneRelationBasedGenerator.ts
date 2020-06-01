import { ManyToOneOptions } from 'mikro-orm';
import _ from 'lodash';
import { CodeBuilder } from '@elg/tscodegen';
import { PropertyBasedGenerator } from './PropertyBasedGenerator';
import { ManyToOneSpecification } from '../..';

/**
 * A base generator class for a many to one edge.
 */
export abstract class ManyToOneRelationBasedGenerator extends PropertyBasedGenerator<
  ManyToOneSpecification
> {}

/**
 * Generates code for a many to one property in a database entity class.
 */
export class ModelManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  generateOptionsString(): string {
    const {
      fromMany: { inverseName },
    } = this.specification;
    const propertyOptions: ManyToOneOptions<any> = {
      ..._.pick(this.specification, ['nullable', 'unique']),
      inversedBy: inverseName,
    };
    return _.isEmpty(propertyOptions) ? '' : JSON.stringify(propertyOptions);
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      toOne: { name, type, nullable },
    } = this.specification;

    const nullUnwrapIndicator = nullable ? '?' : '!';

    return codeBuilder
      .addLine(`@ManyToOne(() => ${type}, ${this.generateOptionsString()})`)
      .addLine(`${name}${nullUnwrapIndicator}: ${type};`);
  }

  importsRequired() {
    const {
      toOne: { type },
    } = this.specification;
    return {
      'mikro-orm': ['ManyToOne'],
      [`../${type}/${type}`]: [type],
    };
  }
}

/**
 * Generates code for a many to one edge in a *Loader class.
 */
export class LoaderManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      toOne: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);

    return codeBuilder.addBlock(`load${methodReadyName}(): ${type}Loader`, (b) =>
      b
        .addBlock(`return new ${type}Loader(this.vc, async (childLoader) =>`, (b) =>
          b
            .addLine('const selves = await this.getAll();')
            .addLine('childLoader.onlyIds(')
            .addLine('selves')
            .addLine('// TODO: Handle errors better')
            .addLine(`.map((self) => (self instanceof Error ? undefined : self?.${name}.id))`)
            .addLine('.filter((self) => self !== undefined) as number[],')
            .addLine(');'),
        )
        .addLine(');'),
    );
  }

  importsRequired() {
    const {
      toOne: { type },
    } = this.specification;
    return {
      [`../${type}/${type}Loader`]: [`${type}Loader`],
    };
  }
}

/**
 * Generates code for a many to one edge in a *Query class.
 */
export class QueryManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      toOne: { name, type },
    } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const idReadyName = `${_.snakeCase(name)}_id`;

    return codeBuilder
      .addBlock(`where${methodReadyName}IdsIn(ids: number[]): this`, (b) =>
        b.addLine(`this.queryBuilder.whereIn('${idReadyName}', ids);`).addLine('return this;'),
      )
      .addLine()
      .addBlock(`query${methodReadyName}(): ${type}Query`, (b) =>
        b
          .addBlock(`return new ${type}Query(this.vc, async (childQuery) =>`, (b) =>
            b.addLine(`childQuery.whereIdsIn(await this.get${methodReadyName}Ids());`),
          )
          .addLine(');'),
      )
      .addLine()
      .addBlock(`async get${methodReadyName}Ids(): Promise<number[]>`, (b) =>
        b
          .addLine('const finalQb = this.queryBuilder')
          .addLine('.clone()')
          .addLine('.clearSelect()')
          .addLine(`.select('id', '${idReadyName}');`)
          .addLine(
            `const results: EntityData<${this.parentEntityType}>[] = await this.vc.entityManager`,
          )
          .addLine(".getConnection('read')")
          .addLine('.execute(finalQb as any);')
          .addLine('const relatedEntitiesWithIds = results.map((result) =>')
          .addLine('this.vc.entityManager.map(this.entityClass, result),')
          .addLine(');')
          .addLine(`return uniq(relatedEntitiesWithIds.flatMap((gent) => gent.${name}.id));`),
      );
  }

  importsRequired() {
    const {
      toOne: { type },
    } = this.specification;
    return {
      'mikro-orm': ['EntityData'],
      lodash: ['uniq'],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
