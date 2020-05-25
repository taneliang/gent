import _ from 'lodash';
import { CodeBuilder } from '../../ts-codegen';

export type ImportMap = { [moduleName: string]: string[] };

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
  Object.entries(importMap).forEach(([moduleName, imports]) =>
    codeBuilder.addLine(`import { ${_.uniq(imports).sort().join(', ')} } from '${moduleName}';`),
  );
  return codeBuilder;
}
