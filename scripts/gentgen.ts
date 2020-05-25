import { getAllSchemaCodegenInfo } from './getAllSchemaCodegenInfo';
import { ModelFileGenerator } from '../FileGenerator/ModelFileGenerator';

function main() {
  const allCodegenInfo = getAllSchemaCodegenInfo();
  for (const codegenInfo of allCodegenInfo) {
    new ModelFileGenerator(codegenInfo).generate();
    // TODO: GentLoaderGenerator GentQueryGenerator GentMutatorGenerator GentGraphQlGraphEntityGenerator
    // TODO: police
  }
}

main();
