import fs from 'fs';
import path from 'path';
import { GentSchema } from '../GentSchema';
import { SchemaCodegenInfo } from './SchemaCodegenInfo';
import { GentSchemaValidationError } from '../GentSchemaValidationError';

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

function validateSchema(
  filePath: string,
  Schema: typeof GentSchema | undefined,
): Schema is typeof GentSchema {
  // Ensure Schema exists and is a class
  if (!Schema || !Schema.prototype) {
    // TODO: Use custom Error subclass
    throw new GentSchemaValidationError(
      `Encountered *Schema.ts file at "${filePath}" that does not have a default exported schema class.`,
    );
  }

  const superclassName = Object.getPrototypeOf(Schema.prototype)?.constructor.name;
  // Ensure Schema is a subclass of GentSchema by doing a simple superclass name
  // check.
  if (superclassName !== GentSchema.prototype.constructor.name) {
    throw new GentSchemaValidationError(
      `Encountered *Schema.ts file at "${filePath}" whose default export is not a subclass of GentSchema.`,
    );
  }

  return true;
}

function processSourceFile(filePath: string): SchemaCodegenInfo {
  const { default: Schema } = require(filePath) as {
    default?: typeof GentSchema & { constructor(): GentSchema };
  };

  if (!validateSchema(filePath, Schema)) {
    throw new GentSchemaValidationError('Unknown error occured when validating schema.');
  }

  return {
    filePath,
    schema: new Schema(),
  };
}

export function getAllSchemaCodegenInfo(): SchemaCodegenInfo[] {
  const schemaPaths = getSchemaPaths();
  return schemaPaths.map((schemaPath) => processSourceFile(schemaPath));
}
