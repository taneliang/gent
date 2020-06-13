import { OneToManyOptions } from "mikro-orm";
import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { OneToManyRelationBasedGenerator } from "./OneToManyRelationBasedGenerator";

/**
 * Generates code for a one to many property in a database entity class.
 */
export class ModelOneToManyRelationGenerator extends OneToManyRelationBasedGenerator {
  private generateOptionsString(): string {
    const propertyOptions: OneToManyOptions<never> = _.pick(
      this.specification.toMany,
      ["nullable", "unique"]
    );
    return _.isEmpty(propertyOptions) ? "" : JSON.stringify(propertyOptions);
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      fromOne: { inverseName },
      toMany: { name, type },
    } = this.specification;
    return codeBuilder
      .addLine(
        `@OneToMany(() => ${type}, (e) => e.${inverseName}, ${this.generateOptionsString()})`
      )
      .addLine(`${name} = new Collection<${type}>(this);`);
  }

  importsRequired(): ImportMap {
    const {
      toMany: { type },
    } = this.specification;
    return {
      "mikro-orm": ["Collection", "OneToMany"],
      [`../${type}/${type}`]: [type],
    };
  }
}
