import { ManyToOneOptions } from 'mikro-orm';
import _ from 'lodash';
import { CodeBuilder } from '@elg/tscodegen';
import { PropertyBasedGenerator } from './PropertyBasedGenerator';
import { ManyToOneSpecification } from '../../schema/properties/RelationBuilder';

export abstract class ManyToOneRelationBasedGenerator extends PropertyBasedGenerator<
  ManyToOneSpecification
> {}

export class ModelManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  generateOptionsString(): string {
    const { inverseRelationName } = this.specification;
    const propertyOptions: ManyToOneOptions<any> = {
      ..._.pick(this.specification, ['nullable', 'unique']),
      inversedBy: inverseRelationName,
    };
    return _.isEmpty(propertyOptions) ? '' : JSON.stringify(propertyOptions);
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type, nullable } = this.specification;

    const nullUnwrapIndicator = nullable ? '?' : '!';

    return codeBuilder
      .addLine(`@ManyToOne(() => ${type}, ${this.generateOptionsString()})`)
      .addLine(`${name}${nullUnwrapIndicator}: ${type};`);
  }

  importsRequired() {
    const { type } = this.specification;
    return {
      'mikro-orm': ['ManyToOne'],
      [`../${type}/${type}`]: [type],
    };
  }
}

export class LoaderManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type } = this.specification;
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
    const { type } = this.specification;
    return {
      [`../${type}/${type}Loader`]: [`${type}Loader`],
    };
  }
}

export class QueryManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type } = this.specification;
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
          .addLine(`const results: EntityData<${this.parentEntityType}>[] = await finalQb;`)
          .addLine('const relatedEntitiesWithIds = results.map((result) =>')
          .addLine('this.vc.entityManager.map(this.entityClass, result),')
          .addLine(');')
          .addLine(`return uniq(relatedEntitiesWithIds.flatMap((gent) => gent.${name}.id));`),
      );
  }

  importsRequired() {
    const { type } = this.specification;
    return {
      'mikro-orm': ['EntityData'],
      lodash: ['uniq'],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
