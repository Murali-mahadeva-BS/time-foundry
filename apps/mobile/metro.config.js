const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all workspace packages so Metro can resolve and transform them
config.watchFolders = [workspaceRoot]

// Resolve node_modules from both the app and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Map @time-foundry/core to the mobile entry point (excludes Dexie)
config.resolver.extraNodeModules = {
  '@time-foundry/core': path.resolve(workspaceRoot, 'packages/core/src/mobile.ts'),
  // expo-linear-gradient satisfies react-native-gifted-charts' peer dependency
  'react-native-linear-gradient': path.resolve(
    projectRoot,
    'node_modules/expo-linear-gradient',
  ),
}

module.exports = withNativeWind(config, { input: './global.css' })
