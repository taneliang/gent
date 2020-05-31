import { CodeBuilder } from '@elg/tscodegen';
import { ModelFieldGenerator } from '../properties/FieldBasedGenerator';
import { ModelOneToManyRelationGenerator } from '../properties/OneToManyRelationBasedGenerator';
import { ModelManyToOneRelationGenerator } from '../properties/ManyToOneRelationBasedGenerator';
import { FileGenerator } from './FileGenerator';
import { buildImportLines } from '../ImportMap';
import { isOneToManySpecification, isManyToOneSpecification } from '../../schema';

export class ModelFileGenerator extends FileGenerator {
  private readonly fieldGenerators = (() =>
    this.codegenInfo.schema.fields.map(
      (spec) => new ModelFieldGenerator(this.codegenInfo.schema.entityName, spec),
    ))();

  private readonly relationGenerators = (() => {
    const { schema } = this.codegenInfo;
    return schema.edges.map((spec) => {
      if (isOneToManySpecification(spec)) {
        return new ModelOneToManyRelationGenerator(schema.entityName, spec);
      } else if (isManyToOneSpecification(spec)) {
        return new ModelManyToOneRelationGenerator(schema.entityName, spec);
      }
      throw new Error(`Unsupported edge specification "${JSON.stringify(spec)}".`);
    });
  })();

  generatedFileNameSuffix(): string {
    return '';
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
    const ourImports = {
      'mikro-orm': ['Entity'],
      '../../gent': ['BaseGent'],
    };
    const generatorImports = [
      ...this.fieldGenerators,
      ...this.relationGenerators,
    ].map((generator) => generator.importsRequired());
    return buildImportLines([ourImports, ...generatorImports], builder);
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
