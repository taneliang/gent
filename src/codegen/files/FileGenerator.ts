import path from 'path';
import { SchemaCodegenInfo } from './SchemaCodegenInfo';
import { CodeFile } from '@elg/tscodegen';

/**
 * From an entity's schema file path, returns a file path for the source file
 * for another of the entity's components, e.g. UserQuery.
 *
 * @param entityName Name of the entity we're genning for, e.g. "User".
 * @param schemaPath Path to schema file. May be relative or absolute.
 * @param componentName e.g. "Loader", "Query", "Mutator", "", etc.
 */
function filePathForComponent(
  entityName: string,
  schemaPath: string,
  componentName: string,
): string {
  return path.join(path.dirname(schemaPath), `${entityName}${componentName}.ts`);
}

/**
 * Base source file generator class.
 */
export abstract class FileGenerator {
  protected readonly codegenInfo: SchemaCodegenInfo;
  protected readonly codeFile: CodeFile;

  constructor(codegenInfo: SchemaCodegenInfo) {
    this.codegenInfo = codegenInfo;

    const { schema, filePath } = codegenInfo;
    const entityName = schema.entityName;
    this.codeFile = new CodeFile(
      filePathForComponent(entityName, filePath, this.generatedFileNameSuffix()),
    );
  }

  /**
   * Generated file and class will be named `<EntityName><suffix>`.
   *
   * E.g. "Loader", "Mutator", "".
   */
  abstract generatedFileNameSuffix(): string;

  /**
   * Generate code and write the resulting source file to disk.
   */
  abstract generate(): void;
}
