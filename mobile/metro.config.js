const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Shared response schema lives beside the web backend.
config.watchFolders = [path.resolve(__dirname, '..')];
module.exports = config;
