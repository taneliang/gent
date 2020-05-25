import { ManyToOneOptions } from 'mikro-orm';
import _ from 'lodash';
import { CodeBuilder } from '../../ts-codegen';
import { PropertyBasedGenerator } from './PropertyBasedGenerator';
import { ManyToOneSpecification } from '../PropertyBuilder/RelationBuilder';

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

  importsRequired(): { [moduleName: string]: string[] } {
    const { type } = this.specification;
    return {
      'mikro-orm': ['ManyToOne'],
      [`../${type}/${type}`]: [type],
    };
  }
}
