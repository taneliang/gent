import { GentSchema } from '../../schema/GentSchema';

/**
 * A type containing codegen information for a schema.
 */
export type SchemaCodegenInfo = {
  filePath: string;
  schema: GentSchema;
};
