module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: 'process.env',
      path: '.env',
      allowUndefined: true,
    }],
    'react-native-reanimated/plugin', // must be last
  ],
};
