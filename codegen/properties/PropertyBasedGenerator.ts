import { CodeBuilder } from '@elg/tscodegen';
import { PropertySpecification } from '../../schema/properties/PropertyBuilder';
import { ImportMap } from '../ImportMap';

export abstract class PropertyBasedGenerator<SpecificationType extends PropertySpecification> {
  protected readonly specification: SpecificationType;

  constructor(specification: SpecificationType) {
    this.specification = specification;
  }

  abstract generateLines(codeBuilder: CodeBuilder): CodeBuilder;

  abstract importsRequired(): ImportMap;
}
