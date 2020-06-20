import { CodeBuilder } from "@elg/tscodegen";
import { LoaderOneToManyRelationGenerator } from "../properties/one-to-many/LoaderOneToManyRelationGenerator";
import { LoaderManyToOneRelationGenerator } from "../properties/many-to-one/LoaderManyToOneRelationGenerator";
import { LoaderOneToOneRelationGenerator } from "../properties/one-to-one/LoaderOneToOneRelationGenerator";
import { FileGenerator } from "./FileGenerator";
import { buildImportLines } from "../ImportMap";
import {
  isOneToManySpecification,
  isManyToOneSpecification,
  isOneToOneSpecification,
} from "../../schema";

/**
 * Generator of *Loader classes.
 */
export class LoaderFileGenerator extends FileGenerator {
  private readonly relationGenerators = (() => {
    const { schema } = this.codegenInfo;
    return schema.edges.map((spec) => {
      if (isOneToManySpecification(spec)) {
        return new LoaderOneToManyRelationGenerator(schema.entityName, spec);
      } else if (isManyToOneSpecification(spec)) {
        return new LoaderManyToOneRelationGenerator(schema.entityName, spec);
      } else if (isOneToOneSpecification(spec)) {
        return new LoaderOneToOneRelationGenerator(schema.entityName, spec);
      }
      throw new Error(
        `Unsupported edge specification "${JSON.stringify(spec)}".`
      );
    });
  })();

  generatedFileNameSuffix(): string {
    return "Loader";
  }

  private buildImportLines(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const ourImports = {
      "@elg/gent": [
        "Beltalowda",
        "GentLoader",
        "GentLoaderGraphViewRestricter",
        "ViewerContext",
      ],
      [`./${entityName}`]: [entityName],
      [`./${entityName}Query`]: [`${entityName}Query`],
    };
    const generatorImports = [...this.relationGenerators].map((generator) =>
      generator.importsRequired()
    );

    buildImportLines([ourImports, ...generatorImports], builder);

    if (this.codegenInfo.schema.codegenOptions?.loader?.enableManualImports) {
      builder.addLine().addManualSection("custom-imports", (b) => b);
    }

    return builder;
  }

  private buildConstructor(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(
      `constructor(vc: ViewerContext, graphViewRestrictor: GentLoaderGraphViewRestricter<${entityName}Loader> | undefined = undefined)`,
      (b) => b.addLine("super(vc, graphViewRestrictor);")
    );
  }

  private buildCreateIdBeltalowda(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(
      `protected createIdBeltalowda(): Beltalowda<${entityName}, number>`,
      (b) =>
        b
          .addLine("return new Beltalowda(")
          .addLine("this.vc,")
          .addLine(`() => new ${entityName}Query(this.vc),`)
          .addLine("'id',")
          .addLine("(model) => model.id,")
          .addLine(");")
    );
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
            `export class ${entityName}Loader extends GentLoader<${entityName}>`,
            (b) => {
              b.addLine(`protected entityClass = ${entityName};`).addLine();
              this.buildConstructor(b).addLine();
              this.buildCreateIdBeltalowda(b).addLine();
              this.buildRelationLines(b);
              if (schema.codegenOptions?.loader?.enableManualMethods) {
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
