import fs from "fs";
import path from "path";
import { GentSchema } from "../schema/GentSchema";
import { SchemaCodegenInfo } from "../codegen/files/SchemaCodegenInfo";
import { GentSchemaValidationError } from "../schema/GentSchemaValidationError";

// Adapted from: https://www.peterbe.com/plog/nodejs-fs-walk-or-glob-or-fast-glob
function walk(pathToWalk: string, filepaths: string[] = []) {
  // Passthrough file paths
  if (fs.lstatSync(pathToWalk).isFile()) {
    filepaths.push(pathToWalk);
    return;
  }

  // Recursively walk and add all *Schema.ts files to filepaths
  const files = fs.readdirSync(pathToWalk);
  for (const filename of files) {
    const filepath = path.join(pathToWalk, filename);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filepaths);
    } else if (path.basename(filename).endsWith("Schema.ts")) {
      filepaths.push(filepath);
    }
  }
}

function getSchemaPaths(paths: string[]): string[] {
  const schemaPaths: string[] = [];
  paths.forEach((path) => walk(path, schemaPaths));
  return schemaPaths;
}

function validateSchema(
  filePath: string,
  Schema: typeof GentSchema | undefined
): Schema is typeof GentSchema {
  // Ensure Schema exists and is a class
  if (!Schema || !Schema.prototype) {
    throw new GentSchemaValidationError(
      `Encountered file at "${filePath}" that does not have a default exported schema class.`
    );
  }

  // Ensure schema's file name === class name.
  const expectedClassName = path.basename(filePath, ".ts");
  const actualClassName = Schema.prototype.constructor.name;
  if (actualClassName !== expectedClassName) {
    throw new GentSchemaValidationError(
      `Schema class should have the same name as its file. The "${actualClassName}" schema at "${filePath}" should be called ${expectedClassName}.`
    );
  }

  const superclassName = Object.getPrototypeOf(Schema.prototype)?.constructor
    .name;
  // Ensure Schema is a subclass of GentSchema by doing a simple superclass name
  // check.
  if (superclassName !== GentSchema.prototype.constructor.name) {
    throw new GentSchemaValidationError(
      `Encountered file at "${filePath}" whose default export is not a subclass of GentSchema.`
    );
  }

  return true;
}

function processSourceFile(
  filePath: string,
  importBasePath: string
): SchemaCodegenInfo {
  const importPath = path.join(importBasePath, filePath);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const exports = require(importPath) as
    | { default?: typeof GentSchema & { new (): GentSchema } }
    | undefined;
  if (!exports) {
    throw new GentSchemaValidationError(
      `Encountered file at "${filePath}" that has no exports.`
    );
  }

  const { default: Schema } = exports;
  if (!validateSchema(filePath, Schema)) {
    throw new GentSchemaValidationError(
      "Unknown error occured when validating schema."
    );
  }

  return {
    filePath,
    schema: new Schema(),
  };
}

/**
 * Walks through a directory and returns the codegen info for all schemas
 * contained within it.
 */
export function discoverSchemas(
  paths: string[],
  importBasePath = process.cwd()
): SchemaCodegenInfo[] {
  const schemaPaths = getSchemaPaths(paths);
  return schemaPaths.map((schemaPath) =>
    processSourceFile(schemaPath, importBasePath)
  );
}
