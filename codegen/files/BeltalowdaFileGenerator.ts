import { CodeBuilder } from '../../../ts-codegen';
import { FileGenerator } from './FileGenerator';
import { buildImportLines } from '../ImportMap';

export class BeltalowdaFileGenerator extends FileGenerator {
  generatedFileNameSuffix(): string {
    return 'Beltalowda';
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const ourImports = {
      '../../gent': ['GentBeltalowda'],
      [`./${entityName}`]: [entityName],
    };
    return buildImportLines([ourImports], builder);
  }

  generate(): void {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    this.codeFile
      .build((b) =>
        this.buildImportLines(b)
          .addLine()
          .addBlock(
            `export class ${entityName}Beltalowda<FieldType extends string | number> extends GentBeltalowda<${entityName}, FieldType>`,
            (b) =>
              b
                .addLine(`protected readonly entityClass = ${entityName};`)
                .addLine()
                .addBlock('applyPreflightRules()', (b) => b.addLine('// TODO:')),
          )
          .format(),
      )
      .saveToFile();
  }
}
