import { PropertySpecification } from "./PropertySpecification";

export type FieldSpecification = PropertySpecification & {
  isPrimaryKey?: boolean;
};
