import _ from 'lodash';
import { FileGenerator } from './FileGenerator';
import { ModelFieldGenerator } from '../PropertyBasedGenerator/FieldBasedGenerator';
import { CodeBuilder } from '../../ts-codegen';

export class ModelFileGenerator extends FileGenerator {
  private fieldGenerators = (() =>
    this.codegenInfo.schema
      .fields()
      .map((builder) => new ModelFieldGenerator(builder.toSpecification())))();

  generatedFileNameSuffix(): string {
    return '';
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
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

    Object.entries(allImports).forEach(([moduleName, imports]) =>
      builder.addLine(`import { ${_.uniq(imports).sort().join(', ')} } from '${moduleName}';`),
    );

    return builder;
  }

  buildFieldLines(builder: CodeBuilder): CodeBuilder {
    this.fieldGenerators.forEach((generator) => generator.generateLines(builder).addLine());
    return builder;
  }

  generate(): void {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    this.codeFile
      .build((b) =>
        this.buildImportLines(b)
          .addLine()
          .addLine('@Entity()')
          .addBlock(`export class ${entityName} extends BaseGent`, (b) => this.buildFieldLines(b))
          .format(),
      )
      .saveToFile();
  }
}
