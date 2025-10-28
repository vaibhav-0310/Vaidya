export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest', // transpile JSX/JS using babel-jest
  },
  moduleFileExtensions: ['js', 'jsx'],
};
