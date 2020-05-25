import path from 'path';
import { SchemaCodegenInfo } from './SchemaCodegenInfo';
import { CodeFile } from '../../ts-codegen';

function filePathForComponent(
  entityName: string,
  schemaPath: string,
  componentName: string,
): string {
  return path.join(path.dirname(schemaPath), `${entityName}${componentName}.ts`);
}

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
   * Generated file and class will be named <EntityName><suffix>.
   *
   * E.g. "Loader", "Mutator", "".
   */
  abstract generatedFileNameSuffix(): string;

  /**
   * Generate code.
   */
  abstract generate(): void;
}
