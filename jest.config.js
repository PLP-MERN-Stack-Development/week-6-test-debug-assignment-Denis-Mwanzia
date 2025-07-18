// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'server',
      rootDir: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      moduleFileExtensions: ['js', 'json', 'node'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      coverageDirectory: '<rootDir>/../coverage/server',
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/config/**',
        '!**/node_modules/**',
      ],
    },
    {
      displayName: 'client',
      rootDir: './client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/tests/**/*.test.{js,jsx}'],
      moduleFileExtensions: ['js', 'jsx'],
      setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
      transform: {
        '^.+\\.(js|jsx)$': [
          'babel-jest',
          { presets: ['@babel/preset-env', '@babel/preset-react'] },
        ],
      },
      coverageDirectory: '<rootDir>/../coverage/client',
      collectCoverageFrom: [
        '<rootDir>/src/**/*.{js,jsx}',
        '!<rootDir>/src/index.js',
      ],
    },
  ],
  verbose: true,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testTimeout: 10000,
};
