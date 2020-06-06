// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // A preset that is used as a base for Jest's configuration
  preset: "ts-jest",
  // The test environment that will be used for testing
  testEnvironment: "node",

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ["src/**/!(*.d).{js,jsx,ts,tsx}"],
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ["/node_modules/"],

  // Only write lcov files in CIs
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ["text"].concat(process.env.CI ? "json" : []),
  // Use this configuration option to add custom reporters to Jest
  reporters: ["default"].concat(
    process.env.CI
      ? [["jest-junit", { outputDirectory: "./test-reports/junit" }]]
      : []
  ),
};
