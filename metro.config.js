const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 解析 @/ 路径别名 → src/
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
