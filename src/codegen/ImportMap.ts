import path from 'path';
import _ from 'lodash';
import { CodeBuilder } from '@elg/tscodegen';

export type ImportMap = { [modulePath: string]: string[] | undefined };

function mergeImportMaps(maps: ImportMap[]): ImportMap {
  function merger(objValue: string[] | undefined, srcValue: string[] | undefined) {
    return [...(objValue ?? []), ...(srcValue ?? [])];
  }

  return maps.reduce((previousValue, currentValue) =>
    _.mergeWith(previousValue, currentValue, merger),
  );
}

function getDefaultNameFromModulePath(modulePath: string): string {
  const rawModuleName = path.basename(modulePath);
  let importableName = rawModuleName;

  // Handle snake/kebab case
  importableName = _.camelCase(rawModuleName);

  // If first char in original name is uppercase (e.g. class, enum names),
  // retain that uppercase first char.
  if (rawModuleName[0] === rawModuleName[0].toUpperCase()) {
    importableName = _.upperFirst(importableName);
  }

  return importableName;
}

export function buildImportLines(importMaps: ImportMap[], codeBuilder: CodeBuilder): CodeBuilder {
  const importMap = mergeImportMaps(importMaps);
  Object.entries(importMap).forEach(([modulePath, imports]) => {
    const importStatementComponents = [];

    if (imports?.includes('default')) {
      importStatementComponents.push(getDefaultNameFromModulePath(modulePath));
    }

    const otherImports = _.without(_.uniq(imports), 'default').sort();
    if (otherImports.length > 0) {
      importStatementComponents.push(`{ ${otherImports.join(', ')} }`);
    }

    if (importStatementComponents.length === 0) {
      codeBuilder.addLine(`import '${modulePath}';`);
    } else {
      codeBuilder.addLine(`import ${importStatementComponents.join(', ')} from '${modulePath}';`);
    }
  });
  return codeBuilder;
}
