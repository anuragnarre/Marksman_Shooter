/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@nestjs/)'
  ]
};
