import { buildImportLines } from "./ImportMap";
import { CodeBuilder } from "@elg/tscodegen";

describe(buildImportLines, () => {
  test("should ignore empty map", () => {
    const builtCode = buildImportLines([{}], new CodeBuilder({})).toString();
    expect(builtCode).toBe("");
  });

  test("should add lines for each module", () => {
    const maps = [
      {
        a: ["one"],
        b: ["two"],
      },
    ];
    const builtCode = buildImportLines(maps, new CodeBuilder({})).toString();
    expect(builtCode).toMatchSnapshot();
  });

  test("should handle default-only module import", () => {
    const maps = [
      {
        camelCaseModule: ["default"],
        PascalCaseModule: ["default"],
        "../../pathModule": ["default"],
        "kebab-case-module": ["default"],
        snake_case_module: ["default"],
        "weird_mixed-separatorModule": ["default"],
        "dot.separated.module": ["default"],
        "@elg/scoped-package": ["default"],

        // Produces an invalid import. Intentional since there's no name we can
        // extract.
        ".": ["default"],
      },
    ];
    const builtCode = buildImportLines(maps, new CodeBuilder({})).toString();
    expect(builtCode).toMatchSnapshot();
  });

  test("should handle destructure-only module import", () => {
    const maps = [
      {
        a: ["one", "two"],
        b: ["two"],
      },
    ];
    const builtCode = buildImportLines(maps, new CodeBuilder({})).toString();
    expect(builtCode).toMatchSnapshot();
  });

  test("should handle default+destructure module import", () => {
    const maps = [
      {
        a: ["one", "default", "two"],
        b: ["default", "three"],
      },
    ];
    const builtCode = buildImportLines(maps, new CodeBuilder({})).toString();
    expect(builtCode).toMatchSnapshot();
  });

  test("should handle empty module import", () => {
    const maps = [
      {
        a: [],
        b: undefined,
      },
    ];
    const builtCode = buildImportLines(maps, new CodeBuilder({})).toString();
    expect(builtCode).toMatchSnapshot();
  });

  test("should merge and deduplicate multiple import maps", () => {
    const maps = [
      {
        a: ["default"],
        b: ["default"],
      },
      // Duplicate map
      {
        a: ["default"],
        b: ["default"],
      },
      {
        a: ["default"], // Duplicated
        b: ["two"], // Same module, different import
        // More modules
        c: ["zero"],
        "./../../moreCharacters": ["minusOne"],
      },
      {
        c: ["one"],
      },
      {
        d: [],
        e: undefined,
      },
      // Empty map
      {},
    ];
    const builtCode = buildImportLines(maps, new CodeBuilder({})).toString();
    expect(builtCode).toMatchSnapshot();
  });
});
