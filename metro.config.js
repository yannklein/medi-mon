const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

let config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

config = withNativeWind(config, { input: './global.css' });

// ─── Web: stub out packages that use import.meta (ESM-only, Hermes-incompatible) ───
// react-native-reanimated 4.x and react-native-worklets use import.meta in their
// source, which throws "Cannot use 'import.meta' outside a module" in Metro's
// hermes-stable web bundle. Neither package is actually used on web in this app.
const prevResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const NATIVE_ONLY = ['react-native-reanimated', 'react-native-worklets'];
    for (const pkg of NATIVE_ONLY) {
      if (moduleName === pkg || moduleName.startsWith(`${pkg}/`)) {
        return { type: 'empty' };
      }
    }
  }
  if (prevResolveRequest) {
    return prevResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
