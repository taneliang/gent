import { PropertySpecification, defaultPartialPropertySpecification } from './PropertyBuilder';
import { PropertyBuilder } from './PropertyBuilder';

export interface FieldSpecification extends PropertySpecification {}

export class FieldBuilder extends PropertyBuilder<FieldSpecification> {
  protected specification: FieldSpecification;

  constructor(name: string, type: string) {
    super();
    this.specification = {
      ...defaultPartialPropertySpecification,
      name,
      type,
    };
  }
}
