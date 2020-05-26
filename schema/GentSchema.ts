import { GentSchemaValidationError } from './GentSchemaValidationError';
import { FieldBuilder } from './properties/FieldBuilder';
import { RelationBuilder } from './properties/RelationBuilder';
import { BaseGent } from '../entities';
import { Police } from '../police/Police';

export abstract class GentSchema {
  /**
   * Name of this entity.
   *
   * Defaults to the name of the class without the "Schema" suffix.
   *
   * @throws Error if class name is "Schema" or is not suffixed with "Schema".
   */
  readonly entityName = (() => {
    const className = this.constructor.name;
    if (!className.endsWith('Schema') || className === 'Schema') {
      throw new GentSchemaValidationError(
        `The name of the "${className}" schema should be in the form <EntityName>Schema, e.g. "${className}Schema".`,
      );
    }
    return className.substring(0, className.length - 'Schema'.length);
  })();

  abstract fields(): FieldBuilder[];
  abstract relations(): RelationBuilder[];

  accessControlRules(police: Police<any, BaseGent>) {
    police.allowAll();
  }
}
