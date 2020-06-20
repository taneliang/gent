import _ from "lodash";
import { PropertyOptions } from "mikro-orm";
import { CodeBuilder } from "@elg/tscodegen";
import { ImportMap } from "../../ImportMap";
import { FieldBasedGenerator } from "./FieldBasedGenerator";

/**
 * Generates code for a field property in a database entity class.
 */
export class ModelFieldGenerator extends FieldBasedGenerator {
  private get decoratorName(): "PrimaryKey" | "Property" {
    const { primaryKey } = this.specification;
    return primaryKey ? "PrimaryKey" : "Property";
  }

  generateLines(codeBuilder: CodeBuilder): CodeBuilder {
    const {
      defaultDatabaseValue,
      defaultValueCode,
      name,
      sqlColumnType,
      type,
    } = this.specification;

    const propertyOptions: PropertyOptions = _.pick(this.specification, [
      "nullable",
      "unique",
    ]);
    if (sqlColumnType) {
      propertyOptions.columnType = sqlColumnType;
    }
    if (defaultDatabaseValue) {
      propertyOptions.default = defaultDatabaseValue;
    }

    const optionsString = _.isEmpty(propertyOptions)
      ? ""
      : JSON.stringify(propertyOptions);
    const nullUnwrapIndicator = propertyOptions.nullable ? "?" : "!";
    const defaultValueAssigner = defaultValueCode
      ? `= ${defaultValueCode}`
      : "";
    return codeBuilder
      .addLine(`@${this.decoratorName}(${optionsString})`)
      .addLine(
        `${name}${nullUnwrapIndicator}: ${type}${defaultValueAssigner};`
      );
  }

  importsRequired(): ImportMap {
    return { "mikro-orm": [this.decoratorName] };
  }
}
