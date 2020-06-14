import { PropertySpecification } from "./PropertySpecification";

export type FieldSpecification = PropertySpecification & {
  primaryKey?: boolean;
};
