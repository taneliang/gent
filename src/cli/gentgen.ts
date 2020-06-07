#!/usr/bin/env ts-node-script

import { Command } from "commander";

import { getAllSchemaCodegenInfo } from "./getAllSchemaCodegenInfo";
import { ModelFileGenerator } from "../codegen/files/ModelFileGenerator";
import { LoaderFileGenerator } from "../codegen/files/LoaderFileGenerator";
import { QueryFileGenerator } from "../codegen/files/QueryFileGenerator";
import { MutatorFileGenerator } from "../codegen/files/MutatorFileGenerator";

const program = new Command();

program
  .command("discover [folder or schema path(s)]")
  .description("Discover schemas")
  .action((_, cmdObj: Command) => {
    console.log("TODO: Discover in folders", cmdObj.args);
    // TODO:
    // const allCodegenInfo = getAllSchemaCodegenInfo(
    //   cmdObj.args || [`${process.cwd()}/src/gents`]
    // );
    // allCodegenInfo.forEach((info) => console.log(info.filePath));
  });

program
  .command("generate [folder or schema path(s)]")
  .description("Generate Gent classes from schemas")
  .action((_, cmdObj: Command) => {
    console.log("TODO: Generate in folders", cmdObj.args);
    // TODO:
    // const allCodegenInfo = getAllSchemaCodegenInfo(
    //   cmdObj.args || ["./src/gents"]
    // );
    // allCodegenInfo.forEach((info) => {
    //   new ModelFileGenerator(codegenInfo).generate();
    //   new LoaderFileGenerator(codegenInfo).generate();
    //   new QueryFileGenerator(codegenInfo).generate();
    //   new MutatorFileGenerator(codegenInfo).generate();
    //   // TODO: GraphQlGraphEntityGenerator
    // });
  });

program.parse(process.argv);
