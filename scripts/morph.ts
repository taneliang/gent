import { Project, SourceFile, ClassDeclaration } from 'ts-morph';
import ts from 'ts-morph/node_modules/typescript';

function processProject() {
  const project = new Project({
    addFilesFromTsConfig: false,
  });

  project.addExistingSourceFiles('./src/gents/*/*Schema.ts');

  const sourceFiles = project.getSourceFiles();
  for (const sourceFile of sourceFiles) {
    processSourceFile(sourceFile);
  }
}

function processSourceFile(sourceFile: SourceFile) {
  for (const sourceClass of sourceFile.getClasses()) {
    if (sourceClass.getHeritageClauseByKind(ts.SyntaxKind.ExtendsKeyword)) {
      console.log(sourceFile.getFilePath());
      processSchemaClass(sourceClass);
    }
  }
}

function processSchemaClass(sourceClass: ClassDeclaration) {
  const codegenInfo = extractInfoFromSchemaClass(sourceClass);
  console.log('hohoho', codegenInfo);
}

function extractInfoFromSchemaClass(sourceClass: ClassDeclaration): GentgenClassInfo | undefined {
  const name = sourceClass.getName();
  if (!name) return undefined;

  const properties = extractPropertiesFromSchemaClass(sourceClass);
  if (!properties) return undefined;

  return {
    name,
    properties,
  };
}

function extractPropertiesFromSchemaClass(sourceClass: ClassDeclaration): string | undefined {
  const propertiesProperty = sourceClass.getProperty('properties');
  if (!propertiesProperty) {
    return undefined;
  }

  const propertyLiteralExpression = propertiesProperty.getChildrenOfKind(
    ts.SyntaxKind.ObjectLiteralExpression,
  )[0];
  if (!propertyLiteralExpression) {
    return undefined;
  }

  const propertyLiteralString = propertyLiteralExpression.getText(false);
  const propertyDescriptor = ts.transpileModule(propertyLiteralString, {
    compilerOptions: {
      target: ts.ScriptTarget.JSON,
      module: ts.ModuleKind.None,
    },
  });
  //   const propertyDescriptor = JSON.parse(propertyLiteralString);

  //   console.log('kan', propertyDescriptor);
  return propertyLiteralString;
}

// processProject();
