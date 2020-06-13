import { PropertyBasedGenerator } from "../PropertyBasedGenerator";
import { ManyToOneSpecification } from "../../..";

/**
 * A base generator class for a many to one edge.
 */
export abstract class ManyToOneRelationBasedGenerator extends PropertyBasedGenerator<
  ManyToOneSpecification
> {}
