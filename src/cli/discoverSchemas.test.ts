import mockFs from "mock-fs";
import { discoverSchemas } from "./discoverSchemas";
import { GentSchemaValidationError } from "../schema";

/**
 * Fake GentSchema class. Perfect for string-based validation of our classes.
 */
class GentSchema {}

class AcadYearSchema extends GentSchema {}
const mockValidSchemaPath = "/src/schemas/AcadYearSchema.ts";
jest.mock(
  "/src/schemas/AcadYearSchema.ts",
  () => ({ default: AcadYearSchema }),
  { virtual: true }
);

const mockMismatchedFilenameSchema = "/src/schemas/MismatchedFilenameSchema.ts";
jest.mock(
  "/src/schemas/MismatchedFilenameSchema.ts",
  () => ({ default: AcadYearSchema }),
  { virtual: true }
);

const mockNestedValidSchemaPath = "/some/other/folder/AcadYearSchema.ts";
jest.mock(
  "/some/other/folder/AcadYearSchema.ts",
  () => ({ default: AcadYearSchema }),
  { virtual: true }
);

const mockNoDefaultExportedSchemaPath =
  "/src/schemas/NoDefaultExportedSchema.ts";
jest.mock(
  "/src/schemas/NoDefaultExportedSchema.ts",
  () => ({ AcadYearSchema }),
  { virtual: true }
);

const mockNotAGentSchemaPath = "/src/schemas/NotAGentSchema.ts";
jest.mock(
  "/src/schemas/NotAGentSchema.ts",
  () => ({ default: class NotAGentSchema {} }),
  { virtual: true }
);

const mockNotClassFilePath = "/some/other/folder/NotClassFile.ts";
jest.mock("/some/other/folder/NotClassFile.ts", () => ({ default: 42 }), {
  virtual: true,
});

const mockNoExportsFilePath = "/some/other/folder/NoExportsFile.ts";
jest.mock("/some/other/folder/NoExportsFile.ts", () => undefined, {
  virtual: true,
});

describe(discoverSchemas, () => {
  beforeEach(() => {
    mockFs({
      [mockValidSchemaPath]: "",
      [mockMismatchedFilenameSchema]: "",
      [mockNestedValidSchemaPath]: "",
      [mockNoDefaultExportedSchemaPath]: "",
      [mockNotAGentSchemaPath]: "",
      [mockNotClassFilePath]: "",
      [mockNoExportsFilePath]: "",
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  test("should do nothing if no paths provided", () => {
    expect(() => discoverSchemas([], "/")).not.toThrow();
  });

  test("should extract valid schema", () => {
    const allExtractedSchemaInfo = discoverSchemas([mockValidSchemaPath], "/");
    expect(allExtractedSchemaInfo).toHaveLength(1);
    expect(allExtractedSchemaInfo[0]).toMatchObject({
      filePath: mockValidSchemaPath,
    });
  });

  test("should walk listed paths and extract valid schemas", () => {
    const allExtractedSchemaInfo = discoverSchemas(["/some"], "/");
    expect(allExtractedSchemaInfo).toHaveLength(1);
    expect(allExtractedSchemaInfo[0]).toMatchObject({
      filePath: mockNestedValidSchemaPath,
    });

    // Expect non-*Schema.ts files to be ignored
    expect(allExtractedSchemaInfo.map((info) => info.filePath)).not.toContain(
      mockNotClassFilePath
    );
  });

  test("should throw if any folder has invalid schemas", () => {
    expect(() => discoverSchemas(["/src"], "/")).toThrow();
  });

  test("should throw if file name !== class name", () => {
    expect(() => discoverSchemas([mockMismatchedFilenameSchema], "/")).toThrow(
      GentSchemaValidationError
    );
  });

  test("should throw if *Schema.ts file has no default exported class", () => {
    expect(() => discoverSchemas([mockNoExportsFilePath], "/")).toThrow(
      GentSchemaValidationError
    );
    expect(() => discoverSchemas([mockNotClassFilePath], "/")).toThrow(
      GentSchemaValidationError
    );
    expect(() =>
      discoverSchemas([mockNoDefaultExportedSchemaPath], "/")
    ).toThrow(GentSchemaValidationError);
  });

  test("should throw if *Schema.ts file's default export is not a GentSchema subclass", () => {
    expect(() => discoverSchemas([mockNotAGentSchemaPath], "/")).toThrow(
      GentSchemaValidationError
    );
  });
});
