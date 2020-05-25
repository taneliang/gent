import { getAllSchemaCodegenInfo } from './getAllSchemaCodegenInfo';
import { ModelFileGenerator } from '../FileGenerator/ModelFileGenerator';
import { BeltalowdaFileGenerator } from '../FileGenerator/BeltalowdaFileGenerator';
import { LoaderFileGenerator } from '../FileGenerator/LoaderGenerator';
import { QueryFileGenerator } from '../FileGenerator/QueryGenerator';

function main() {
  const allCodegenInfo = getAllSchemaCodegenInfo();
  for (const codegenInfo of allCodegenInfo) {
    new ModelFileGenerator(codegenInfo).generate();
    new BeltalowdaFileGenerator(codegenInfo).generate();
    new LoaderFileGenerator(codegenInfo).generate();
    new QueryFileGenerator(codegenInfo).generate();
    // TODO: MutatorGenerator GraphQlGraphEntityGenerator
    // TODO: police
  }
}

main();
