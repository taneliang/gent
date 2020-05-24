export interface PropertySpecification {
  name: string;
  type: string;
  nullable?: boolean;
  unique?: boolean;
}

export const defaultPartialPropertySpecification: Readonly<Omit<
  PropertySpecification,
  'name' | 'type'
>> = {};

export abstract class PropertyBuilder<SpecificationType extends PropertySpecification> {
  protected abstract specification: SpecificationType;

  nullable(): this {
    this.specification.nullable = true;
    return this;
  }

  unique(): this {
    this.specification.unique = true;
    return this;
  }

  toSpecification(): SpecificationType {
    return this.specification;
  }
}
