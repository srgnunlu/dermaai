module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // Strip all console.log/info/debug from production bundles so no PII/PHI
  // can leak to device logs (KVKK/PHI requirement). error/warn are kept for
  // genuine error reporting. Dev builds keep console output for debugging.
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    // babel-preset-expo auto-adds react-native-worklets/plugin (reanimated 4)
    // when the package is installed, so it must remain the preset.
    presets: ['babel-preset-expo'],
    plugins,
  };
};
