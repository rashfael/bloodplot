const path = require('path')
const webpack = require('webpack')
// const targetStub = process.env.NODE_ENV === 'development' ? 'dev' : 'prod'

module.exports = {
	devServer: {
		host: 'localhost',
		disableHostCheck: true,
		port: 8880
	},
	transpileDependencies: ['buntpapier'],
	configureWebpack: {
		resolve: {
			symlinks: false, // don't flatten symlinks (for npm link)
			modules: [path.resolve('src'), path.resolve('src/styles'), 'node_modules'],
			// alias: {
			// 	'config': path.resolve(__dirname, `config.${targetStub}.js`)
			// }
		},
		plugins: [
			new webpack.DefinePlugin({
				'DEVELOPMENT': process.env.NODE_ENV === 'development'
			})
		],
	},
	css: {
		loaderOptions: {
			stylus: {
				use: [require('buntpapier/stylus')()]
			}
		}
	},
	lintOnSave: true
}
