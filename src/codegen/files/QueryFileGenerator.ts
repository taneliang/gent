import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { FileGenerator } from "./FileGenerator";
import { QueryFieldGenerator } from "../properties/field/QueryFieldGenerator";
import { QueryOneToManyRelationGenerator } from "../properties/one-to-many/QueryOneToManyRelationGenerator";
import { QueryManyToOneRelationGenerator } from "../properties/many-to-one/QueryManyToOneRelationGenerator";
import { QueryOneToOneRelationGenerator } from "../properties/one-to-one/QueryOneToOneRelationGenerator";
import { buildImportLines } from "../ImportMap";
import {
  isOneToManySpecification,
  isManyToOneSpecification,
  isOneToOneSpecification,
} from "../../schema";

/**
 * Generator of *Query classes.
 */
export class QueryFileGenerator extends FileGenerator {
  private readonly fieldGenerators = (() =>
    this.codegenInfo.schema.fields.map(
      (spec) =>
        new QueryFieldGenerator(this.codegenInfo.schema.entityName, spec)
    ))();

  private readonly relationGenerators = (() => {
    const { schema } = this.codegenInfo;
    return schema.edges.map((spec) => {
      if (isOneToManySpecification(spec)) {
        return new QueryOneToManyRelationGenerator(schema.entityName, spec);
      } else if (isManyToOneSpecification(spec)) {
        return new QueryManyToOneRelationGenerator(schema.entityName, spec);
      } else if (isOneToOneSpecification(spec)) {
        return new QueryOneToOneRelationGenerator(schema.entityName, spec);
      }
      throw new Error(
        `Unsupported edge specification "${JSON.stringify(spec)}".`
      );
    });
  })();

  generatedFileNameSuffix(): string {
    return "Query";
  }

  private buildImportLines(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const ourImports = {
      "@elg/gent": [
        "GentQuery",
        "GentQueryGraphViewRestricter",
        "Police",
        "ViewerContext",
      ],
      [`./${entityName}`]: [entityName],
      [`./${entityName}Mutator`]: [`${entityName}Mutator`],
      [`./${entityName}Schema`]: ["default"],
    };
    const generatorImports = [
      ...this.fieldGenerators,
      ...this.relationGenerators,
    ].map((generator) => generator.importsRequired());

    buildImportLines([ourImports, ...generatorImports], builder);

    if (this.codegenInfo.schema.codegenOptions?.query?.enableManualImports) {
      builder.addLine().addManualSection("custom-imports", (b) => b);
    }

    return builder;
  }

  private buildConstructor(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(
      `constructor(
      vc: ViewerContext,
      graphViewRestrictor: GentQueryGraphViewRestricter<${entityName}Query> | undefined = undefined,
      shouldApplyAccessControlRules = true,
      )`,
      (b) =>
        b.addLine(
          `super(vc, ${entityName}, graphViewRestrictor, shouldApplyAccessControlRules);`
        )
    );
  }

  private buildApplyAccessControlRules(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    // TODO: Consider using MikroORM's naming strategy instead
    const tableReadyEntityName = _.snakeCase(entityName);

    return builder.addBlock("protected applyAccessControlRules(): void", (b) =>
      b
        .addLine(
          `const authorizedSubviewQuery = new ${entityName}Query(this.vc, undefined, false);`
        )
        .addLine(
          `const police = new Police<${entityName}Query, ${entityName}>(this.vc, 'read', authorizedSubviewQuery)`
        )
        .addLine(".allowIfOmnipotent();")
        .addLine(`${entityName}Schema.accessControlRules(police);`)
        .addLine("police.throwIfNoDecision();")
        .addLine()
        .addBlock("if (police.decision?.type === 'deny')", (b) =>
          b.addLine(
            // TODO: Use a custom Error subclass
            `throw new Error(\`Not allowed to query ${entityName}. Reason: "\${police.decision.reason}"\`);`
          )
        )
        .addBlock(
          "else if (police.decision?.type === 'allow-restricted')",
          (b) =>
            b
              .addLine("this.queryBuilder.with(")
              .addLine(`'${tableReadyEntityName}',`)
              .addLine(
                "this.queryBuilder.client.raw(police.decision.restrictedQuery.queryBuilder.toQuery()),"
              )
              .addLine(");")
        )
    );
  }

  private buildMutate(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(`mutate(): ${entityName}Mutator`, (b) =>
      b
        .addBlock(
          `return new ${entityName}Mutator(this.vc, async (_childMutator, knexQueryBuilder) =>`,
          (b) =>
            b.addLine("knexQueryBuilder.whereIn('id', await this.getIds());")
        )
        .addLine(");")
    );
  }

  private buildFieldLines(builder: CodeBuilder): CodeBuilder {
    this.fieldGenerators.forEach((generator) =>
      generator.generateLines(builder).addLine()
    );
    return builder;
  }

  private buildRelationLines(builder: CodeBuilder): CodeBuilder {
    this.relationGenerators.forEach((generator) =>
      generator.generateLines(builder).addLine()
    );
    return builder;
  }

  generate(): void {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    this.codeFile
      .build((b) =>
        this.buildImportLines(b)
          .addLine()
          .addBlock(
            `export class ${entityName}Query extends GentQuery<${entityName}>`,
            (b) => {
              b.addLine(`protected entityClass = ${entityName};`).addLine();
              this.buildConstructor(b).addLine();
              this.buildApplyAccessControlRules(b).addLine();
              this.buildMutate(b).addLine();
              this.buildFieldLines(b);
              this.buildRelationLines(b);
              if (schema.codegenOptions?.query?.enableManualMethods) {
                b.addLine().addManualSection("custom-methods", (b) => b);
              }
              return b;
            }
          )
          .format()
      )
      .lock(this.fileDocblockContent)
      .saveToFile();
  }
}
