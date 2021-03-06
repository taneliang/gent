import { CodeBuilder } from "@elg/tscodegen";
import { ModelFieldGenerator } from "../properties/field/ModelFieldGenerator";
import { ModelOneToManyRelationGenerator } from "../properties/one-to-many/ModelOneToManyRelationGenerator";
import { ModelManyToOneRelationGenerator } from "../properties/many-to-one/ModelManyToOneRelationGenerator";
import { ModelOneToOneRelationGenerator } from "../properties/one-to-one/ModelOneToOneRelationGenerator";
import { FileGenerator } from "./FileGenerator";
import { buildImportLines } from "../ImportMap";
import {
  isOneToManySpecification,
  isManyToOneSpecification,
  isOneToOneSpecification,
} from "../../schema";

/**
 * Generator of the file containing the database entity class, e.g. `User.ts`.
 */
export class ModelFileGenerator extends FileGenerator {
  private readonly fieldGenerators = (() =>
    this.codegenInfo.schema.fields.map(
      (spec) =>
        new ModelFieldGenerator(this.codegenInfo.schema.entityName, spec)
    ))();

  private readonly relationGenerators = (() => {
    const { schema } = this.codegenInfo;
    return schema.edges.map((spec) => {
      if (isOneToManySpecification(spec)) {
        return new ModelOneToManyRelationGenerator(schema.entityName, spec);
      } else if (isManyToOneSpecification(spec)) {
        return new ModelManyToOneRelationGenerator(schema.entityName, spec);
      } else if (isOneToOneSpecification(spec)) {
        return new ModelOneToOneRelationGenerator(schema.entityName, spec);
      }
      throw new Error(
        `Unsupported edge specification "${JSON.stringify(spec)}".`
      );
    });
  })();

  generatedFileNameSuffix(): string {
    return "";
  }

  private buildImportLines(builder: CodeBuilder): CodeBuilder {
    const ourImports = {
      "mikro-orm": ["Entity"],
      "@elg/gent": ["GentModel"],
    };
    const generatorImports = [
      ...this.fieldGenerators,
      ...this.relationGenerators,
    ].map((generator) => generator.importsRequired());

    buildImportLines([ourImports, ...generatorImports], builder);

    if (this.codegenInfo.schema.codegenOptions?.model?.enableManualImports) {
      builder.addLine().addManualSection("custom-imports", (b) => b);
    }

    return builder;
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

  private buildFileContents(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    this.buildImportLines(builder).addLine();

    if (schema.codegenOptions?.model?.enableManualEntityDecoratorOptions) {
      builder
        .addBlock("@Entity(", (b) =>
          b.addManualSection("entity-decorator-options", (b) => b)
        )
        .addLine(")");
    } else {
      builder.addLine("@Entity()");
    }

    if (schema.codegenOptions?.model?.enableManualEntityDecorators) {
      builder.addManualSection("entity-decorators", (b) => b);
    }

    builder.addBlock(`export class ${entityName} implements GentModel`, (b) => {
      this.buildFieldLines(b);
      this.buildRelationLines(b);
      if (schema.codegenOptions?.model?.enableManualMethods) {
        b.addLine().addManualSection("custom-methods", (b) => b);
      }
      return b;
    });

    return builder.format();
  }

  generate(): void {
    this.codeFile
      .build((builder) => this.buildFileContents(builder))
      .lock(this.fileDocblockContent)
      .saveToFile();
  }
}
