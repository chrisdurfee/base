const path = require('path');

// This is the main configuration object.
// Here, you write different options and tell Webpack what to do
module.exports = {

    target: 'web',
    entry: {
        index: './src/base.js',
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'base.js',
        library: 'base',
        libraryTarget: 'umd',
        globalObject: 'this',
        umdNamedDefine: true
    }
};