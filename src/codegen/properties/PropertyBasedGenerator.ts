import { CodeBuilder } from '@elg/tscodegen';
import { ImportMap } from '../ImportMap';

/**
 * A base class that generates code for a property.
 */
export abstract class PropertyBasedGenerator<SpecificationType> {
  /**
   * The class name of the entity this property belongs to.
   */
  protected readonly parentEntityType: string;

  /**
   * The specification of this property.
   */
  protected readonly specification: SpecificationType;

  constructor(parentEntityType: string, specification: SpecificationType) {
    this.parentEntityType = parentEntityType;
    this.specification = specification;
  }

  /**
   * Generate code corresponding to this property.
   */
  abstract generateLines(codeBuilder: CodeBuilder): CodeBuilder;

  /**
   * Returns the module imports required by this property.
   */
  abstract importsRequired(): ImportMap;
}
