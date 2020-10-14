import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { join, resolve } from 'path'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import { Configuration } from 'webpack'

const config: Configuration = {
  entry: './src/main.ts',
  devtool: 'source-map',
  output: {
    path: resolve(__dirname, './dist'),
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({})],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new HtmlWebpackPlugin({ template: './src/index.html' }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {},
}

const withDevServer: any = {
  ...config,
  devServer: {
    contentBase: join(__dirname, 'dist'),
    compress: true,
    port: 9000,
  },
}

export = withDevServer
