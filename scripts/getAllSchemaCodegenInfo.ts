import fs from 'fs';
import path from 'path';
import { GentSchema } from '../GentSchema';
import { SchemaCodegenInfo } from './SchemaCodegenInfo';

// Adapted from: https://www.peterbe.com/plog/nodejs-fs-walk-or-glob-or-fast-glob
function walk(directory: string, filepaths: string[] = []) {
  const files = fs.readdirSync(directory);
  for (let filename of files) {
    const filepath = path.join(directory, filename);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filepaths);
    } else if (path.basename(filename).endsWith('Schema.ts')) {
      filepaths.push(filepath);
    }
  }
}

function getSchemaPaths(): string[] {
  const schemaPaths: string[] = [];
  // TODO: Make path customizable
  walk(`${process.cwd()}/src/gents`, schemaPaths);
  return schemaPaths;
}

function validateSchema(filePath: string, Schema: typeof GentSchema | undefined) {
  // Ensure Schema exists and is a class
  if (!Schema || !Schema.prototype) {
    // TODO: Use custom Error subclass
    throw new Error(
      `Encountered *Schema.ts file at "${filePath}" that does not have a default exported schema class.`,
    );
  }

  const superclassName = Object.getPrototypeOf(Schema.prototype)?.constructor.name;
  // Ensure Schema is a subclass of GentSchema by doing a simple superclass name
  // check.
  if (superclassName !== GentSchema.prototype.constructor.name) {
    throw new Error(
      `Encountered *Schema.ts file at "${filePath}" whose default export is not a subclass of GentSchema.`,
    );
  }

  // Ensure Schema is named *Schema so that we can generate the actual name from
  // it.
  const className = Schema.prototype.constructor.name;
  if (!className.endsWith('Schema') || className === 'Schema') {
    throw new Error(
      `Schema class in "${filePath}" should be named <EntityName>Schema, e.g. "${className}Schema".`,
    );
  }
}

type TypeofDefiniteGentSchema = typeof GentSchema & { constructor(): GentSchema };

function extractCodegenInfoFromSchema(
  filePath: string,
  DefiniteSchema: TypeofDefiniteGentSchema,
): SchemaCodegenInfo {
  const schema = new DefiniteSchema();

  const className = schema.constructor.name;
  const entityName = className.substring(0, className.length - 'Schema'.length);

  const properties = schema.properties;
  return {
    filePath,
    name: entityName,
    properties,
  };
}

function processSourceFile(filePath: string): SchemaCodegenInfo {
  const { default: Schema } = require(filePath) as { default?: typeof GentSchema };

  validateSchema(filePath, Schema);
  const DefiniteSchema = Schema as typeof GentSchema & { constructor(): GentSchema };

  return extractCodegenInfoFromSchema(filePath, DefiniteSchema);
}

export function getAllSchemaCodegenInfo(): SchemaCodegenInfo[] {
  const schemaPaths = getSchemaPaths();
  return schemaPaths.map((schemaPath) => processSourceFile(schemaPath));
}
