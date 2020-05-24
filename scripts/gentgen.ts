import { getAllSchemaCodegenInfo } from './getAllSchemaCodegenInfo';
import { GentMikroOrmModelGenerator } from '../GentGenerator/GentMikroOrmModelGenerator';

function main() {
  const allCodegenInfo = getAllSchemaCodegenInfo();
  for (const codegenInfo of allCodegenInfo) {
    new GentMikroOrmModelGenerator(codegenInfo).generate();
    // TODO: GentLoaderGenerator GentQueryGenerator GentMutatorGenerator GentGraphQlGraphEntityGenerator
    // TODO: police
  }
}

main();
