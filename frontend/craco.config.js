// CRACO Configuration to fix source-map-loader issues with framer-motion
// This configuration completely disables source-map-loader for all node_modules
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find and modify the source-map-loader rule to exclude all node_modules
      webpackConfig.module.rules.forEach(rule => {
        if (rule.enforce === 'pre' && rule.use) {
          const loaders = Array.isArray(rule.use) ? rule.use : [rule.use];
          
          loaders.forEach(loader => {
            if (loader.loader && loader.loader.includes('source-map-loader')) {
              // Exclude all node_modules from source-map-loader
              rule.exclude = /node_modules/;
            }
          });
        }
      });

      // Suppress all source map related warnings and errors
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /source-map-loader/,
        /ENOENT/,
        /Can't resolve/,
      ];

      // Use eval-source-map for development to avoid external source map issues
      if (webpackConfig.mode === 'development') {
        webpackConfig.devtool = 'eval-source-map';
      }

      return webpackConfig;
    },
  },
};

