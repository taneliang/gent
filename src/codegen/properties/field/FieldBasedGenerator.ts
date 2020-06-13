import { PropertyBasedGenerator } from "../PropertyBasedGenerator";
import { FieldSpecification } from "../../..";

/**
 * A base generator class for a particular entity field.
 */
export abstract class FieldBasedGenerator extends PropertyBasedGenerator<
  FieldSpecification
> {}
