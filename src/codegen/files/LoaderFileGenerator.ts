import { CodeBuilder } from "@elg/tscodegen";
import { LoaderOneToManyRelationGenerator } from "../properties/OneToManyRelationBasedGenerator";
import { LoaderManyToOneRelationGenerator } from "../properties/ManyToOneRelationBasedGenerator";
import { FileGenerator } from "./FileGenerator";
import { buildImportLines } from "../ImportMap";
import {
  isOneToManySpecification,
  isManyToOneSpecification,
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
      }
      throw new Error(
        `Unsupported edge specification "${JSON.stringify(spec)}".`
      );
    });
  })();

  generatedFileNameSuffix(): string {
    return "Loader";
  }

  buildImportLines(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;
    const ourImports = {
      "../../gent": [
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
    return buildImportLines([ourImports, ...generatorImports], builder);
  }

  buildConstructor(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock(
      `constructor(vc: ViewerContext, graphViewRestrictor: GentLoaderGraphViewRestricter<${entityName}Loader> | undefined = undefined)`,
      (b) => b.addLine("super(vc, graphViewRestrictor);")
    );
  }

  buildCreateIdBeltalowda(builder: CodeBuilder): CodeBuilder {
    const { schema } = this.codegenInfo;
    const entityName = schema.entityName;

    return builder.addBlock("protected createIdBeltalowda()", (b) =>
      b
        .addLine("return new Beltalowda(")
        .addLine("this.vc,")
        .addLine(`() => new ${entityName}Query(this.vc),`)
        .addLine("'id',")
        .addLine("(model) => model.id,")
        .addLine(");")
    );
  }

  buildRelationLines(builder: CodeBuilder): CodeBuilder {
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
              return b;
            }
          )
          .format()
      )
      .saveToFile();
  }
}
