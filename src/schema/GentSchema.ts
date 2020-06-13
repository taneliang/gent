import {
  GentModel,
  EdgeSpecification,
  FieldSpecification,
  GentQuery,
  GentSchemaValidationError,
  Police,
} from "..";

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
    if (!className.endsWith("Schema") || className === "Schema") {
      throw new GentSchemaValidationError(
        `The name of the "${className}" schema should be in the form <EntityName>Schema, e.g. "${className}Schema".`
      );
    }
    return className.substring(0, className.length - "Schema".length);
  })();

  abstract get fields(): FieldSpecification[];
  abstract get edges(): EdgeSpecification[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static accessControlRules(police: Police<GentQuery<any>, GentModel>): void {
    police.allowAll();
  }
}
