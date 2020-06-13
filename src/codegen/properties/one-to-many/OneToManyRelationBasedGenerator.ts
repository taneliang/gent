import { PropertyBasedGenerator } from "../PropertyBasedGenerator";
import { OneToManySpecification } from "../../..";

/**
 * A base generator class for a one to many edge.
 */
export abstract class OneToManyRelationBasedGenerator extends PropertyBasedGenerator<
  OneToManySpecification
> {}
