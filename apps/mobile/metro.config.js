const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

/** Pacotes instalados só em apps/mobile (pnpm isolado). */
function pinModule(name) {
  try {
    return path.dirname(require.resolve(`${name}/package.json`, { paths: [projectRoot] }));
  } catch {
    return null;
  }
}

const pinned = ['expo-clipboard'].reduce(
  (acc, name) => {
    const resolved = pinModule(name);
    if (resolved) acc[name] = resolved;
    return acc;
  },
  {},
);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...pinned,
};

module.exports = config;
