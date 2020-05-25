import _ from 'lodash';
import { CodeBuilder } from '../../ts-codegen';
import { ModelFieldGenerator } from '../PropertyBasedGenerator/FieldBasedGenerator';
import { OneToManyBuilder, ManyToOneBuilder } from '../PropertyBuilder/RelationBuilder';
import { ModelOneToManyRelationGenerator } from '../PropertyBasedGenerator/OneToManyRelationBasedGenerator';
import { ModelManyToOneRelationGenerator } from '../PropertyBasedGenerator/ManyToOneRelationBasedGenerator';
import { FileGenerator } from './FileGenerator';
import { buildImportLines } from '../ImportMap';

export class ModelFileGenerator extends FileGenerator {
  private fieldGenerators = (() =>
    this.codegenInfo.schema
      .fields()
      .map((builder) => new ModelFieldGenerator(builder.toSpecification())))();

  private relationGenerators = (() =>
    this.codegenInfo.schema.relations().map((builder) => {
      const spec = builder.toSpecification();
      if (builder instanceof OneToManyBuilder) {
        return new ModelOneToManyRelationGenerator(spec);
      } else if (builder instanceof ManyToOneBuilder) {
        return new ModelManyToOneRelationGenerator(spec);
      }
      throw new Error(`Unsupported relation builder type "${builder.constructor.name}".`);
    }))();

  generatedFileNameSuffix(): string {
    return '';
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
    const ourImports = {
      'mikro-orm': ['Entity'],
      '../../gent/entities/BaseGent': ['BaseGent'],
    };
    const generatorImports = [
      ...this.fieldGenerators,
      ...this.relationGenerators,
    ].map((generator) => generator.importsRequired());
    return buildImportLines([...generatorImports, ourImports], builder);
  }

  buildFieldLines(builder: CodeBuilder): CodeBuilder {
    this.fieldGenerators.forEach((generator) => generator.generateLines(builder).addLine());
    return builder;
  }

  buildRelationLines(builder: CodeBuilder): CodeBuilder {
    this.relationGenerators.forEach((generator) => generator.generateLines(builder).addLine());
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
          .addBlock(`export class ${entityName} extends BaseGent`, (b) => {
            this.buildFieldLines(b);
            this.buildRelationLines(b);
            return b;
          })
          .format(),
      )
      .saveToFile();
  }
}
