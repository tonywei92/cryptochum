const multipleEntry = require('react-app-rewire-multiple-entry')([
  {
    entry: 'src/contents.js',
    template: 'public/contents.html',
    outPath: '/contents.html'
  }
]);

const {
  override,
  addPostcssPlugins
} = require('customize-cra');



module.exports = {
  webpack: override(
    multipleEntry.addMultiEntry,
    function (config, env) {
      config.optimization.splitChunks = {
        cacheGroups: {
          default: false
        }
      };
      config.optimization.runtimeChunk = false;
      return config;
    },
    function (config, env) {
      config.output.filename = 'static/js/[name].js';
      config.output.chunkFilename = 'static/js/[name].chunk.js';
      config.plugins.forEach(plugin => {
        if (plugin.constructor.name === 'MiniCssExtractPlugin') {
          plugin.options.filename = 'static/css/[name].css';
          plugin.options.chunkFilename = 'static/css/[name].chunk.css';
          // plugin.options.moduleFilename = () => 'static/css/main.css'
        }
      })
      return config;
    },
    addPostcssPlugins([
      require('tailwindcss'),
      require('autoprefixer'),
    ]),
    function (config, env) {
      console.log(config.plugins[9])
      return config;
    }
  )
};