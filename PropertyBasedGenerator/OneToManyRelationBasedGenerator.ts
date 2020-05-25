import { OneToManyOptions } from 'mikro-orm';
import _ from 'lodash';
import { CodeBuilder } from '../../ts-codegen';
import { PropertyBasedGenerator } from './PropertyBasedGenerator';
import { OneToManySpecification } from '../PropertyBuilder/RelationBuilder';

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
