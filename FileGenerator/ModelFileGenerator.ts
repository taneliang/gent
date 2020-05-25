import _ from 'lodash';
import { FileGenerator } from './FileGenerator';
import { ModelFieldGenerator } from '../PropertyBasedGenerator/FieldBasedGenerator';

export class ModelFileGenerator extends FileGenerator {
  private fieldGenerators = (() =>
    this.codegenInfo.schema
      .fields()
      .map((builder) => new ModelFieldGenerator(builder.toSpecification())))();

  generatedFileNameSuffix(): string {
    return '';
  }

  generateImportLines(): string {
    function merger(objValue: string[], srcValue: string[]) {
      return [...objValue, ...srcValue];
    }

    const ourImports = {
      'mikro-orm': ['Entity'],
      '../../gent/entities/BaseGent': ['BaseGent'],
    };

    const allImports = this.fieldGenerators
      .map((generator) => generator.importsRequired())
      .reduce(
        (previousValue, currentValue) => _.mergeWith(previousValue, currentValue, merger),
        ourImports,
      );

    return Object.entries(allImports)
      .map(
        ([moduleName, imports]) =>
          `import { ${_.uniq(imports).sort().join(', ')} } from '${moduleName}';`,
      )
      .join('\n');
  }

  generate(): void {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const fields = schema.fields();

    this.codeFile
      .build((b) =>
        b
          .addLine(this.generateImportLines())
          .addLine()
          .addLine('@Entity()')
          .addBlock(`export class ${entityName} extends BaseGent`, (b) => {
            this.fieldGenerators.forEach((generator) => generator.generateLines(b).addLine());
            return b;
          })
          .format(),
      )
      .saveToFile();
  }
}
