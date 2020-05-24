import path from 'path';
import { getAllSchemaCodegenInfo } from './getAllSchemaCodegenInfo';
import { SchemaCodegenInfo } from './SchemaCodegenInfo';
import { CodeFile } from '../../ts-codegen';

function filePathForComponent(
  entityName: string,
  schemaPath: string,
  componentName: string,
): string {
  return path.join(path.dirname(schemaPath), `${entityName}${componentName}.ts`);
}

function genModel(codegenInfo: SchemaCodegenInfo) {
  const { schema, filePath } = codegenInfo;
  const entityName = schema.entityName;
  new CodeFile(filePathForComponent(entityName, filePath, ''))
    .build((b) =>
      b
        .addLine("import { EntitySchema } from 'mikro-orm';")
        .addLine("import { BaseGent } from '../gent/entities/BaseGent';")
        .addLine()
        .addBlock(`export class ${entityName} extends BaseGent`, (b) =>
          b.addLine('// TODO: Some shit'),
        )
        .addLine()
        .addBlock(`export const schema = new EntitySchema<${entityName}, BaseGent>(`, (b) =>
          b
            .addLine(`name: '${entityName}',`)
            .addLine("extends: 'BaseGent',")
            .addBlock('properties:', (b) => b.addLine('// TODO: Some other shit')),
        )
        .addLine(');')
        .format(),
    )
    .saveToFile();
}

function main() {
  const allCodegenInfo = getAllSchemaCodegenInfo();
  for (const codegenInfo of allCodegenInfo) {
    genModel(codegenInfo);
    // TODO: Loader, query, GraphQL
    // TODO: Mutator, police
  }
}

main();
