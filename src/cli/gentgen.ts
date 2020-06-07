#!/usr/bin/env ts-node-script

import { Command } from "commander";

import { discoverSchemas } from "./discoverSchemas";
import { ModelFileGenerator } from "../codegen/files/ModelFileGenerator";
import { LoaderFileGenerator } from "../codegen/files/LoaderFileGenerator";
import { QueryFileGenerator } from "../codegen/files/QueryFileGenerator";
import { MutatorFileGenerator } from "../codegen/files/MutatorFileGenerator";

const program = new Command();

program.description("Gent's generator CLI.").on("--help", function () {
  console.log("");
  console.log("Examples:");
  console.log("");
  console.log("  $ gentgen discover");
  console.log("  $ gentgen generate");
  console.log("  $ gentgen generate src/gents");
  console.log("  $ gentgen generate src/gents/User/UserSchema.ts");
});

program
  .command("discover [folder-or-schema-path(s)]")
  .description("Discover schemas")
  .action((_, cmdObj: Command) => {
    const allCodegenInfo = discoverSchemas(
      cmdObj.args || [`${process.cwd()}/src/gents`]
    );
    allCodegenInfo.forEach((info) => console.log(info.filePath));
  })
  .on("--help", function () {
    console.log("");
    console.log("Examples:");
    console.log("");
    console.log("  $ gentgen discover");
    console.log("  $ gentgen discover src/gents");
    console.log("  $ gentgen discover src/gents src/other-gents");
    console.log("  $ gentgen discover src/gents/User/UserSchema.ts");
  });

program
  .command("generate [folder-or-schema-path(s)]")
  .description("Generate Gent classes from schemas")
  .option("-v, --verbose")
  .action((_, cmdObj: Command) => {
    const allCodegenInfo = discoverSchemas(
      cmdObj.args || [`${process.cwd()}/src/gents`]
    );
    allCodegenInfo.forEach((info) => {
      if (cmdObj.verbose) {
        console.log("Generating classes for", info.filePath);
      }
      new ModelFileGenerator(info).generate();
      new LoaderFileGenerator(info).generate();
      new QueryFileGenerator(info).generate();
      new MutatorFileGenerator(info).generate();
      // TODO: GraphQlGraphEntityGenerator
    });
  })
  .on("--help", function () {
    console.log("");
    console.log("Examples:");
    console.log("");
    console.log("  $ gentgen generate");
    console.log("  $ gentgen generate src/gents");
    console.log("  $ gentgen generate src/gents/User/UserSchema.ts");
    console.log("  $ gentgen generate src/gents src/gents/User/UserSchema.ts");
  });

program.parse(process.argv);
