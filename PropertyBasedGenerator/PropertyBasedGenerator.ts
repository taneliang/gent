import { CodeBuilder } from '../../ts-codegen';
import { PropertySpecification } from '../PropertyBuilder/PropertyBuilder';

export abstract class PropertyBasedGenerator<SpecificationType extends PropertySpecification> {
  protected readonly specification: SpecificationType;

  constructor(specification: SpecificationType) {
    this.specification = specification;
  }

  abstract generateLines(codeBuilder: CodeBuilder): CodeBuilder;

  abstract importsRequired(): { [moduleName: string]: string[] };
}
