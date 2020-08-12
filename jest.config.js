module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true,
  coverageDirectory: "./coverage/",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/*.{js,jsx,ts,tsx}",
    "!src/entry.ts",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/coverage/**",
    "!**/typings/**"
  ],
  coverageReporters: [
    "lcov",
    "text"
  ],
  reporters: [
    "default"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/node_modules/"
  ]
}
