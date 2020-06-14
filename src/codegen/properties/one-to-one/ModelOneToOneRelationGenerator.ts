import { OneToOneOptions } from "mikro-orm";
import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { OneToOneRelationBasedGenerator } from "./OneToOneRelationBasedGenerator";

/**
 * Generates code for a one to one property in a database entity class.
 */
export class ModelOneToOneRelationGenerator extends OneToOneRelationBasedGenerator {
  private generateOptionsString(): string {
    const propertyOptions: OneToOneOptions<never> = {
      ..._.pick(this.specification.fromOne, ["owner"]),
      ..._.pick(this.specification.toOne, ["nullable", "unique"]),
    };
    return _.isEmpty(propertyOptions) ? "" : JSON.stringify(propertyOptions);
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      fromOne: { inverseName },
      toOne: { name, type, nullable },
    } = this.specification;

    const nullUnwrapIndicator = nullable ? "?" : "!";

    return codeBuilder
      .addLine(
        `@OneToOne(() => ${type}, (e) => e.${inverseName}, ${this.generateOptionsString()})`
      )
      .addLine(`${name}${nullUnwrapIndicator}: ${type};`);
  }

  importsRequired(): ImportMap {
    const {
      toOne: { type },
    } = this.specification;
    return {
      "mikro-orm": ["OneToOne"],
      [`../${type}/${type}`]: [type],
    };
  }
}
