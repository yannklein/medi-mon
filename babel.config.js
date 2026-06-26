module.exports = function (api) {
  // api.caller() configures caching automatically — don't also call api.cache()
  const isWeb = api.caller(
    (caller) => caller && caller.name === 'metro' && caller.platform === 'web'
  );

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Skip the Reanimated plugin on web — no worklets used on web,
      // and it can trigger reanimated runtime imports that use import.meta.
      ...(!isWeb ? ['react-native-reanimated/plugin'] : []),
    ],
  };
};
