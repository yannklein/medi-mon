const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

let config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

config = withNativeWind(config, { input: './global.css' });

// ─── Web: fix import.meta incompatibilities ───────────────────────────────────
const prevResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Stub native-only packages that use import.meta in their source
    const NATIVE_ONLY = ['react-native-reanimated', 'react-native-worklets'];
    for (const pkg of NATIVE_ONLY) {
      if (moduleName === pkg || moduleName.startsWith(`${pkg}/`)) {
        return { type: 'empty' };
      }
    }

    // Zustand: Metro resolves the `import` condition → esm/*.mjs which uses
    // import.meta.env. Force CJS instead by pointing at the .js files directly.
    if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
      const subpath = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
      const cjsPath = path.join(__dirname, 'node_modules', 'zustand', `${subpath}.js`);
      const fs = require('fs');
      if (fs.existsSync(cjsPath)) {
        return { type: 'sourceFile', filePath: cjsPath };
      }
    }
  }
  if (prevResolveRequest) {
    return prevResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
