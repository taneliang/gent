import { CodeBuilder } from '@elg/tscodegen';
import { OneToManyBuilder, ManyToOneBuilder } from '../../schema/properties/RelationBuilder';
import { LoaderOneToManyRelationGenerator } from '../properties/OneToManyRelationBasedGenerator';
import { LoaderManyToOneRelationGenerator } from '../properties/ManyToOneRelationBasedGenerator';
import { FileGenerator } from './FileGenerator';
import { buildImportLines } from '../ImportMap';

export class LoaderFileGenerator extends FileGenerator {
  private readonly relationGenerators = (() =>
    this.codegenInfo.schema.relations().map((builder) => {
      const spec = builder.toSpecification();
      if (builder instanceof OneToManyBuilder) {
        return new LoaderOneToManyRelationGenerator(spec);
      } else if (builder instanceof ManyToOneBuilder) {
        return new LoaderManyToOneRelationGenerator(spec);
      }
      throw new Error(`Unsupported relation builder type "${builder.constructor.name}".`);
    }))();

  generatedFileNameSuffix(): string {
    return 'Loader';
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const ourImports = {
      '../../gent': [
        'GentBeltalowda',
        'GentLoader',
        'GentLoaderGraphViewRestricter',
        'ViewerContext',
      ],
      [`./${entityName}`]: [entityName],
    };
    const generatorImports = [...this.relationGenerators].map((generator) =>
      generator.importsRequired(),
    );
    return buildImportLines([ourImports, ...generatorImports], builder);
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
          .addBlock(`export class ${entityName}Loader extends GentLoader<${entityName}>`, (b) => {
            b.addLine(`protected entityClass = ${entityName};`)
              .addLine()
              .addBlock(
                `constructor(vc: ViewerContext, graphViewRestrictor: GentLoaderGraphViewRestricter<${entityName}Loader> | undefined = undefined)`,
                (b) => b.addLine('super(vc, graphViewRestrictor);'),
              )
              .addLine()
              .addBlock('protected createIdBeltalowda()', (b) =>
                b.addLine(
                  `return new GentBeltalowda(this.vc, ${entityName}, 'id', (model) => model.id);`,
                ),
              )
              .addLine();
            this.buildRelationLines(b);
            return b;
          })
          .format(),
      )
      .saveToFile();
  }
}
