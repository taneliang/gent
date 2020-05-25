import _ from 'lodash';
import { PropertyOptions } from 'mikro-orm';
import { FieldSpecification } from '../../schema/properties/FieldBuilder';
import { PropertyBasedGenerator } from './PropertyBasedGenerator';
import { CodeBuilder } from '../../../ts-codegen';

export abstract class FieldBasedGenerator extends PropertyBasedGenerator<FieldSpecification> {}

export class ModelFieldGenerator extends FieldBasedGenerator {
  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type } = this.specification;
    const propertyOptions: PropertyOptions = _.pick(this.specification, ['nullable', 'unique']);

    const optionsString = _.isEmpty(propertyOptions) ? '' : JSON.stringify(propertyOptions);
    const nullUnwrapIndicator = propertyOptions.nullable ? '?' : '!';
    return codeBuilder
      .addLine(`@Property(${optionsString})`)
      .addLine(`${name}${nullUnwrapIndicator}: ${type};`);
  }

  importsRequired() {
    return { 'mikro-orm': ['Property'] };
  }
}

export class QueryFieldGenerator extends FieldBasedGenerator {
  buildStringFieldLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name } = this.specification;
    const methodReadyName = _.upperFirst(name);

    return codeBuilder.addBlock(`where${methodReadyName}(pattern: RegExp | string): this`, (b) =>
      b.addLine(`this.queryBuilder.andWhere({ ${name}: pattern });`).addLine('return this;'),
    );
  }

  buildGenericFieldLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { name, type } = this.specification;
    const methodReadyName = _.upperFirst(name);

    return codeBuilder.addBlock(`where${methodReadyName}(value: ${type}): this`, (b) =>
      b.addLine(`this.queryBuilder.andWhere({ ${name}: value });`).addLine('return this;'),
    );
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const { type } = this.specification;

    switch (type) {
      case 'string':
        return this.buildStringFieldLines(codeBuilder);
      default:
        return this.buildGenericFieldLines(codeBuilder);
    }
  }

  importsRequired() {
    return {};
  }
}
