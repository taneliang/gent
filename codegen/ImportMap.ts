import path from 'path';
import _ from 'lodash';
import { CodeBuilder } from '@elg/tscodegen';

export type ImportMap = { [modulePath: string]: string[] };

export function mergeImportMaps(maps: ImportMap[]): ImportMap {
  function merger(objValue: string[], srcValue: string[]) {
    return [...(objValue ?? []), ...(srcValue ?? [])];
  }

  return maps.reduce((previousValue, currentValue) =>
    _.mergeWith(previousValue, currentValue, merger),
  );
}

export function buildImportLines(importMaps: ImportMap[], codeBuilder: CodeBuilder): CodeBuilder {
  const importMap = mergeImportMaps(importMaps);
  Object.entries(importMap).forEach(([modulePath, imports]) => {
    const importStatementComponents = [];

    if (imports.includes('default')) {
      importStatementComponents.push(path.basename(modulePath));
    }

    const otherImports = _.without(_.uniq(imports), 'default').sort();
    if (otherImports.length > 0) {
      importStatementComponents.push(`{ ${otherImports.join(', ')} }`);
    }

    if (importStatementComponents.length === 0) {
      return;
    }
    codeBuilder.addLine(`import ${importStatementComponents.join(', ')} from '${modulePath}';`);
  });
  return codeBuilder;
}
