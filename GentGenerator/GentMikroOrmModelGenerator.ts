import { GentGenerator } from './GentGenerator';

export class GentMikroOrmModelGenerator extends GentGenerator {
  generatedFileNameSuffix(): string {
    return '';
  }

  generate(): void {
    const entityName = this.codegenInfo.schema.entityName;
    this.codeFile
      .build((b) =>
        b
          .addLine("import { EntitySchema } from 'mikro-orm';")
          .addLine("import { BaseGent } from '../gent/entities/BaseGent';")
          .addLine()
          .addBlock(`export class ${entityName} extends BaseGent`, (b) =>
            b.addLine('// TODO: Some shit'),
          )
          .addLine()
          .addBlock(`export const schema = new EntitySchema<${entityName}, BaseGent>(`, (b) =>
            b
              .addLine(`name: '${entityName}',`)
              .addLine("extends: 'BaseGent',")
              .addBlock('properties:', (b) => b.addLine('// TODO: Some other shit')),
          )
          .addLine(');')
          .format(),
      )
      .saveToFile();
  }
}
