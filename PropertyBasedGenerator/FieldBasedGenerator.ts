import _ from 'lodash';
import { PropertyOptions } from 'mikro-orm';
import { FieldSpecification } from '../PropertyBuilder/FieldBuilder';
import { PropertyBasedGenerator } from './PropertyBasedGenerator';
import { CodeBuilder } from '../../ts-codegen';

export abstract class FieldBasedGenerator extends PropertyBasedGenerator<FieldSpecification> {}

export class ModelFieldGenerator extends FieldBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type, nullable, unique } = this.specification;
    const propertyOptions: PropertyOptions = _.pick(this.specification, ['nullable', 'unique']);

    const optionsString = _.isEmpty(propertyOptions) ? '' : JSON.stringify(propertyOptions);
    const nullUnwrapIndicator = propertyOptions.nullable ? '?' : '!';
    return codeBuilder
      .addLine(`@Property(${optionsString})`)
      .addLine(`${name}${nullUnwrapIndicator}: ${type};`);
  }

  importsRequired(): { [moduleName: string]: string[] } {
    return { 'mikro-orm': ['Property'] };
  }
}
