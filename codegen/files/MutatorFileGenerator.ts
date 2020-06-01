import { CodeBuilder } from '@elg/tscodegen';
import { FileGenerator } from './FileGenerator';
import { buildImportLines } from '../ImportMap';

/**
 * Generator of *Mutator classes.
 */
export class MutatorFileGenerator extends FileGenerator {
  generatedFileNameSuffix(): string {
    return 'Mutator';
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const ourImports = {
      knex: ['QueryBuilder'],
      '../../gent': [
        'GentMutator',
        'GentMutatorGraphViewRestricter',
        'MutationAction',
        'Police',
        'ViewerContext',
      ],
      [`./${entityName}`]: [entityName],
      [`./${entityName}Query`]: [`${entityName}Query`],
      [`./${entityName}Schema`]: ['default'],
    };
    return buildImportLines([ourImports], builder);
  }

  buildFromEntities(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(
      `static fromEntities(vc: ViewerContext, entities: ${entityName}[]): ${entityName}Mutator`,
      (b) =>
        // WARNING: DO NOT REMOVE THE {} AROUND THE KNEX QB!
        // GentMutator will await the returned qb and that'll fire a query to
        // the db. Yes, awaiting a query builder sends a query to the db. I'm
        // sure it's a feature... right?
        b
          .addBlock('return new this(vc, (_childMutator, knexQueryBuilder) =>', (b) =>
            b
              .addLine('knexQueryBuilder.whereIn(')
              .addLine("'id',")
              .addLine('entities.map((entity) => entity.id),')
              .addLine(');'),
          )
          .addLine(');'),
    );
  }

  buildApplyAccessControlRules(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(
      'applyAccessControlRules(action: MutationAction, knexQueryBuilder: QueryBuilder)',
      (b) =>
        b
          .addLine(
            `const authorizedSubviewQuery = new ${entityName}Query(this.vc, undefined, false);`,
          )
          .addLine(`const police = new Police<${entityName}Query, ${entityName}>(`)
          .addLine('this.vc,')
          .addLine('action,')
          .addLine('authorizedSubviewQuery,')
          .addLine(').allowIfOmnipotent();')
          .addLine(`${entityName}Schema.accessControlRules(police);`)
          .addLine('police.throwIfNoDecision();')
          .addLine()
          .addBlock("if (police.decision?.type === 'deny')", (b) =>
            b.addLine(
              `throw new Error(\`Not allowed to query ${entityName}. Reason: "\${police.decision.reason}"\`);`,
            ),
          )
          .addBlock("else if (police.decision?.type === 'allow-restricted')", (b) =>
            b
              .addLine('knexQueryBuilder.whereIn(')
              .addLine("'id',")
              .addLine("police.decision.restrictedQuery.queryBuilder.clearSelect().select('id'),")
              .addLine(');'),
          ),
    );
  }

  generate(): void {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    this.codeFile
      .build((b) =>
        this.buildImportLines(b)
          .addLine()
          .addBlock(`export class ${entityName}Mutator extends GentMutator<${entityName}>`, (b) => {
            b.addLine(`protected entityClass = ${entityName};`)
              .addLine()
              .addBlock(
                `constructor(vc: ViewerContext, graphViewRestrictor: GentMutatorGraphViewRestricter<${entityName}Mutator> | undefined = undefined)`,
                (b) => b.addLine(`super(vc, ${entityName}, graphViewRestrictor);`),
              )
              .addLine();
            this.buildFromEntities(b);
            b.addLine();
            this.buildApplyAccessControlRules(b);
            return b;
          })
          .format(),
      )
      .saveToFile();
  }
}
