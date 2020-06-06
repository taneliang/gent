import _ from 'lodash';
import { CodeBuilder } from '@elg/tscodegen';
import { FileGenerator } from './FileGenerator';
import { QueryFieldGenerator } from '../properties/FieldBasedGenerator';
import { QueryOneToManyRelationGenerator } from '../properties/OneToManyRelationBasedGenerator';
import { QueryManyToOneRelationGenerator } from '../properties/ManyToOneRelationBasedGenerator';
import { buildImportLines } from '../ImportMap';
import { isOneToManySpecification, isManyToOneSpecification } from '../../schema';

/**
 * Generator of *Query classes.
 */
export class QueryFileGenerator extends FileGenerator {
  private readonly fieldGenerators = (() =>
    this.codegenInfo.schema.fields.map(
      (spec) => new QueryFieldGenerator(this.codegenInfo.schema.entityName, spec),
    ))();

  private readonly relationGenerators = (() => {
    const { schema } = this.codegenInfo;
    return schema.edges.map((spec) => {
      if (isOneToManySpecification(spec)) {
        return new QueryOneToManyRelationGenerator(schema.entityName, spec);
      } else if (isManyToOneSpecification(spec)) {
        return new QueryManyToOneRelationGenerator(schema.entityName, spec);
      }
      throw new Error(`Unsupported edge specification "${JSON.stringify(spec)}".`);
    });
  })();

  generatedFileNameSuffix(): string {
    return 'Query';
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const ourImports = {
      '../../gent': ['GentQuery', 'GentQueryGraphViewRestricter', 'Police', 'ViewerContext'],
      [`./${entityName}`]: [entityName],
      [`./${entityName}Mutator`]: [`${entityName}Mutator`],
      [`./${entityName}Schema`]: ['default'],
    };
    const generatorImports = [
      ...this.fieldGenerators,
      ...this.relationGenerators,
    ].map((generator) => generator.importsRequired());
    return buildImportLines([ourImports, ...generatorImports], builder);
  }

  buildConstructor(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(
      `constructor(
      vc: ViewerContext,
      graphViewRestrictor: GentQueryGraphViewRestricter<${entityName}Query> | undefined = undefined,
      shouldApplyAccessControlRules = true,
      )`,
      (b) =>
        b.addLine(`super(vc, ${entityName}, graphViewRestrictor, shouldApplyAccessControlRules);`),
    );
  }

  buildApplyAccessControlRules(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    // TODO: Consider using MikroORM's naming strategy instead
    const tableReadyEntityName = _.snakeCase(entityName);

    return builder.addBlock('protected applyAccessControlRules()', (b) =>
      b
        .addLine(
          `const authorizedSubviewQuery = new ${entityName}Query(this.vc, undefined, false);`,
        )
        .addLine(
          `const police = new Police<${entityName}Query, ${entityName}>(this.vc, 'read', authorizedSubviewQuery)`,
        )
        .addLine('.allowIfOmnipotent();')
        .addLine(`${entityName}Schema.accessControlRules(police);`)
        .addLine('police.throwIfNoDecision();')
        .addLine()
        .addBlock("if (police.decision?.type === 'deny')", (b) =>
          b.addLine(
            // TODO: Use a custom Error subclass
            `throw new Error(\`Not allowed to query ${entityName}. Reason: "\${police.decision.reason}"\`);`,
          ),
        )
        .addBlock("else if (police.decision?.type === 'allow-restricted')", (b) =>
          b
            .addLine('this.queryBuilder.with(')
            .addLine(`'${tableReadyEntityName}',`)
            .addLine(
              'this.queryBuilder.client.raw(police.decision.restrictedQuery.queryBuilder.toQuery()),',
            )
            .addLine(');'),
        ),
    );
  }

  buildMutate(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(`mutate(): ${entityName}Mutator`, (b) =>
      b
        .addBlock(
          `return new ${entityName}Mutator(this.vc, async (_childMutator, knexQueryBuilder) =>`,
          (b) => b.addLine("knexQueryBuilder.whereIn('id', await this.getIds());"),
        )
        .addLine(');'),
    );
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
            b.addLine(`protected entityClass = ${entityName};`).addLine();
            this.buildConstructor(b).addLine();
            this.buildApplyAccessControlRules(b).addLine();
            this.buildMutate(b).addLine();
            this.buildFieldLines(b);
            this.buildRelationLines(b);
            return b;
          })
          .format(),
      )
      .saveToFile();
  }
}
