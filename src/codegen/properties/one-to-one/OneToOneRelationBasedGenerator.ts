import { PropertyBasedGenerator } from "../PropertyBasedGenerator";
import { OneToOneSpecification } from "../../..";

/**
 * A base generator class for a one to one edge.
 */
export abstract class OneToOneRelationBasedGenerator extends PropertyBasedGenerator<
  OneToOneSpecification
> {}
