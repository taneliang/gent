import { ManyToOneOptions } from "mikro-orm";
import _ from "lodash";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { ManyToOneRelationBasedGenerator } from "./ManyToOneRelationBasedGenerator";

/**
 * Generates code for a many to one property in a database entity class.
 */
export class ModelManyToOneRelationGenerator extends ManyToOneRelationBasedGenerator {
  generateOptionsString(): string {
    const {
      fromMany: { inverseName },
    } = this.specification;
    const propertyOptions: ManyToOneOptions<never> = {
      ..._.pick(this.specification, ["nullable", "unique"]),
      inversedBy: inverseName,
    };
    return _.isEmpty(propertyOptions) ? "" : JSON.stringify(propertyOptions);
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      toOne: { name, type, nullable },
    } = this.specification;

    const nullUnwrapIndicator = nullable ? "?" : "!";

    return codeBuilder
      .addLine(`@ManyToOne(() => ${type}, ${this.generateOptionsString()})`)
      .addLine(`${name}${nullUnwrapIndicator}: ${type};`);
  }

  importsRequired(): ImportMap {
    const {
      toOne: { type },
    } = this.specification;
    return {
      "mikro-orm": ["ManyToOne"],
      [`../${type}/${type}`]: [type],
    };
  }
}
