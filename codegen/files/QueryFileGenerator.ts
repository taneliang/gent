import _ from 'lodash';
import { CodeBuilder } from '../../../ts-codegen';
import { FileGenerator } from './FileGenerator';
import { QueryFieldGenerator } from '../properties/FieldBasedGenerator';
import { OneToManyBuilder, ManyToOneBuilder } from '../..';
import { QueryOneToManyRelationGenerator } from '../properties/OneToManyRelationBasedGenerator';
import { QueryManyToOneRelationGenerator } from '../properties/ManyToOneRelationBasedGenerator';
import { buildImportLines } from '../ImportMap';

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
      '../../gent': ['GentQuery', 'GentQueryGraphViewRestricter', 'Police', 'ViewerContext'],
      [`./${entityName}`]: [entityName],
      [`./${entityName}Schema`]: ['default'],
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
              .addLine()
              .addBlock('applyAccessControlRules()', (b) =>
                b
                  .addLine(`const police = new Police<this, ${entityName}>(this.vc, 'read', this)`)
                  .addLine('.allowIfOmnipotent();')
                  .addLine(`new ${entityName}Schema().accessControlRules(police);`)
                  .addLine('police.throwIfNoDecision();')
                  .addBlock("if (police.decision?.type === 'deny')", (b) =>
                    b.addLine(
                      // TODO: Use a custom Error subclass
                      `throw new Error(\`Not allowed to query ${entityName}. Reason: "\${police.decision.reason}"\`);`,
                    ),
                  ),
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
