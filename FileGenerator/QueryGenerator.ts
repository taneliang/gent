import _ from 'lodash';
import { CodeBuilder } from '../../ts-codegen';
import { FileGenerator } from './FileGenerator';
import { buildImportLines } from '../ImportMap';
import { QueryFieldGenerator } from '../PropertyBasedGenerator/FieldBasedGenerator';
import { OneToManyBuilder, ManyToOneBuilder } from '../PropertyBuilder/RelationBuilder';
import { QueryOneToManyRelationGenerator } from '../PropertyBasedGenerator/OneToManyRelationBasedGenerator';
import { QueryManyToOneRelationGenerator } from '../PropertyBasedGenerator/ManyToOneRelationBasedGenerator';

export class QueryFileGenerator extends FileGenerator {
  private readonly fieldGenerators = (() =>
    this.codegenInfo.schema
      .fields()
      .map((builder) => new QueryFieldGenerator(builder.toSpecification())))();

  private readonly relationGenerators = (() =>
    this.codegenInfo.schema.relations().map((builder) => {
      const spec = builder.toSpecification();
      if (builder instanceof OneToManyBuilder) {
        return new QueryOneToManyRelationGenerator(spec);
      } else if (builder instanceof ManyToOneBuilder) {
        return new QueryManyToOneRelationGenerator(spec);
      }
      throw new Error(`Unsupported relation builder type "${builder.constructor.name}".`);
    }))();

  generatedFileNameSuffix(): string {
    return 'Query';
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const ourImports = {
      '../../gent': ['ViewerContext'],
      '../../gent/GentQuery': ['GentQuery', 'GentQueryGraphViewRestricter'],
      [`./${entityName}`]: [entityName],
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
          .addBlock(`export class ${entityName}Query extends GentQuery<${entityName}>`, (b) => {
            b.addLine(`protected entityClass = ${entityName};`)
              .addLine()
              .addBlock(
                `constructor(vc: ViewerContext, graphViewRestrictor: GentQueryGraphViewRestricter<${entityName}Query> | undefined = undefined)`,
                (b) => b.addLine(`super(vc, ${entityName}, graphViewRestrictor);`),
              )
              .addLine();
            this.buildFieldLines(b);
            this.buildRelationLines(b);
            return b;
          })
          .format(),
      )
      .saveToFile();
  }
}
