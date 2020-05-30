import { OneToManyOptions } from 'mikro-orm';
import _ from 'lodash';
import { CodeBuilder } from '@elg/tscodegen';
import { PropertyBasedGenerator } from './PropertyBasedGenerator';
import { OneToManySpecification } from '../../schema/properties/RelationBuilder';

abstract class OneToManyRelationBasedGenerator extends PropertyBasedGenerator<
  OneToManySpecification
> {}

export class ModelOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  generateOptionsString(): string {
    const propertyOptions: OneToManyOptions<any> = _.pick(this.specification, [
      'nullable',
      'unique',
    ]);
    return _.isEmpty(propertyOptions) ? '' : JSON.stringify(propertyOptions);
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type, inverseRelationName } = this.specification;
    return codeBuilder
      .addLine(
        `@OneToMany(() => ${type}, (e) => e.${inverseRelationName}, ${this.generateOptionsString()})`,
      )
      .addLine(`${name} = new Collection<${type}>(this);`);
  }

  importsRequired() {
    const { type } = this.specification;
    return {
      'mikro-orm': ['Collection', 'OneToMany'],
      [`../${type}/${type}`]: [type],
    };
  }
}

export class LoaderOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type, inverseRelationName } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const idReadyInverseRelationName = `${_.snakeCase(inverseRelationName)}_id`;

    return codeBuilder
      .addBlock(`load${methodReadyName}(): ${type}Loader`, (b) =>
        b
          .addBlock(`return new ${type}Loader(this.vc, async (childLoader) =>`, (b) =>
            b
              .addLine(`const entitiesOrErrors = await this.get${methodReadyName}();`)
              .addLine('const entityIds = entitiesOrErrors')
              .addLine('// TODO: Handle errors better')
              .addLine('.filter((entitiesOrError) => entitiesOrError instanceof Array)')
              .addLine(`.flatMap((entities) => entities as ${type}[])`)
              .addLine('.map((entity) => entity.id);')
              .addLine('childLoader.onlyIds(entityIds);'),
          )
          .addLine(');'),
      )
      .addLine()
      .addBlock(`async get${methodReadyName}(): Promise<(${type}[] | Error)[]>`, (b) =>
        b
          .addLine('return this.vc.dataloaders')
          .addBlock(`.beltalowdaForModel(${type}, '${idReadyInverseRelationName}', () =>`, (b) =>
            b
              .addLine('return new GentBeltalowda(')
              .addLine('this.vc,')
              .addLine(`() => new ${type}Query(this.vc),`)
              .addLine(`'${idReadyInverseRelationName}',`)
              .addLine(`(model) => model.${inverseRelationName}.id,`)
              .addLine(');'),
          )
          .addLine(')')
          .addLine('.loadManyWithManyEntitiesEach(this.ids);'),
      );
  }

  importsRequired() {
    const { type } = this.specification;
    return {
      [`../${type}/${type}`]: [type],
      [`../${type}/${type}Loader`]: [`${type}Loader`],
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}

export class QueryOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type, inverseRelationName } = this.specification;
    const methodReadyName = _.upperFirst(name);
    const methodReadyInverseRelationName = _.upperFirst(inverseRelationName);

    return codeBuilder.addBlock(`query${methodReadyName}(): ${type}Query`, (b) =>
      b
        .addBlock(`return new ${type}Query(this.vc, async (childQuery) =>`, (b) =>
          b.addLine(`childQuery.where${methodReadyInverseRelationName}IdsIn(await this.getIds());`),
        )
        .addLine(');'),
    );
  }

  importsRequired() {
    const { type } = this.specification;
    return {
      [`../${type}/${type}Query`]: [`${type}Query`],
    };
  }
}
