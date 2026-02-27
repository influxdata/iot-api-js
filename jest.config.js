module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@influxdata)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.worktrees/',
  ],
};
