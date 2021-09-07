const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = (env, argv) => {
  const isDev = argv.mode !== "production";

  const plugins = [new HtmlWebpackPlugin({ template: "./index.html" })];
  if (!isDev) plugins.push(new MiniCssExtractPlugin());

  return {
    entry: "./src/index.tsx",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js",
    },
    plugins,
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            isDev ? "style-loader" : MiniCssExtractPlugin.loader,
            "css-loader",
            "postcss-loader",
          ],
        },
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      minimizer: [new CssMinimizerPlugin()],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },
    devServer: {
      port: 4000,
    },
  };
};
