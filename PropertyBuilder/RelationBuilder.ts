import { PropertySpecification, defaultPartialPropertySpecification } from './PropertyBuilder';
import { PropertyBuilder } from './PropertyBuilder';

export interface RelationSpecification extends PropertySpecification {
  inverseRelationName: string;
}

export const defaultPartialRelationSpecification: Readonly<Omit<
  RelationSpecification,
  'name' | 'type' | 'inverseRelationName'
>> = {};

export abstract class RelationBuilder<
  SpecificationType extends RelationSpecification = RelationSpecification
> extends PropertyBuilder<SpecificationType> {}

/**
 * M instances of this entity refer to 0/1 instance of `type`.
 */
export interface ManyToOneSpecification extends RelationSpecification {}

export class ManyToOneBuilder extends PropertyBuilder<RelationSpecification> {
  protected specification: ManyToOneSpecification;

  constructor(name: string, type: string, inverseRelationName: string) {
    super();
    this.specification = {
      ...defaultPartialRelationSpecification,
      name,
      type,
      inverseRelationName,
    };
  }
}

/**
 * 0/1 instance of this entity refer to M instances of `type`.
 *
 * This entity will own the other, i.e. in SQL terms, this entity's table will
 * store the foreign key that references the other table.
 */
export interface OneToManySpecification extends RelationSpecification {}

export class OneToManyBuilder extends PropertyBuilder<RelationSpecification> {
  protected specification: OneToManySpecification;

  constructor(name: string, type: string, inverseRelationName: string) {
    super();
    this.specification = {
      ...defaultPartialRelationSpecification,
      name,
      type,
      inverseRelationName,
    };
  }
}

export interface OneToOneSpecification extends RelationSpecification {
  isOwner: boolean;
}

export class OneToOneBuilder extends PropertyBuilder<RelationSpecification> {
  protected specification: OneToOneSpecification;

  constructor(name: string, type: string, inverseRelationName: string, isOwner: boolean) {
    super();
    this.specification = {
      ...defaultPartialRelationSpecification,
      name,
      type,
      inverseRelationName,
      isOwner,
    };
  }
}

// TODO: Many to many
