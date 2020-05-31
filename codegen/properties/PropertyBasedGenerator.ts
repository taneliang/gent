import { CodeBuilder } from '@elg/tscodegen';
import { ImportMap } from '../ImportMap';

export abstract class PropertyBasedGenerator<SpecificationType> {
  protected readonly parentEntityType: string;
  protected readonly specification: SpecificationType;

  constructor(parentEntityType: string, specification: SpecificationType) {
    this.parentEntityType = parentEntityType;
    this.specification = specification;
  }

  abstract generateLines(codeBuilder: CodeBuilder): CodeBuilder;

  abstract importsRequired(): ImportMap;
}
