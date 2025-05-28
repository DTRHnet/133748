// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }], // Good practice for Node.js environments
    '@babel/preset-react',
  ],
};
