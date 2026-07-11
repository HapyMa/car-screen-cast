const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const srcRoot = path.resolve(projectRoot, 'src');

const config = getDefaultConfig(projectRoot);

// 将 @/ 路径别名解析为 src/ (兼容 EAS 临时构建目录)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const realPath = path.resolve(srcRoot, moduleName.slice(2));
    return context.resolveRequest(context, realPath, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
