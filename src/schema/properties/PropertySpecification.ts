export interface PropertySpecification {
  name: string;
  type: string;
  nullable?: boolean;
  unique?: boolean;

  /**
   * TypeScript code string that computes a default value for the property.
   * This string will be added verbatim to the generated model code.
   *
   * @example "'Sometimes Fires Go Out'" // value = 'Sometimes Fires Go Out'
   * @example "new Date()" // value = new Date()
   * @example "null" // value = null
   * @example "0" // value = 0
   */
  defaultValueCode?: string;

  /**
   * Default value that will be provided by the database.
   *
   * WARNING: String values may need to be provided in quotes! Unquoted strings
   * will be executed as database functions.
   *
   * @example 42 // The number 42
   * @example "NOW()" // Database 'now' function - useful for createdAt fields
   * @example "'now'" // Also the database 'now' function, for date fields
   * @example "'now'" // Also the string value "now", for string fields
   */
  defaultDatabaseValue?: unknown;
}
