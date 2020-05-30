import { getAllSchemaCodegenInfo } from './getAllSchemaCodegenInfo';
import { ModelFileGenerator } from '../codegen/files/ModelFileGenerator';
import { LoaderFileGenerator } from '../codegen/files/LoaderFileGenerator';
import { QueryFileGenerator } from '../codegen/files/QueryFileGenerator';

function main() {
  const allCodegenInfo = getAllSchemaCodegenInfo();
  for (const codegenInfo of allCodegenInfo) {
    new ModelFileGenerator(codegenInfo).generate();
    new LoaderFileGenerator(codegenInfo).generate();
    new QueryFileGenerator(codegenInfo).generate();
    // TODO: MutatorGenerator GraphQlGraphEntityGenerator
    // TODO: police
  }
}

main();
