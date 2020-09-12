// https://blog.usejournal.com/creating-a-react-app-from-scratch-f3c693b84658

const path = require("path");
const webpack = require("webpack");
const fs = require("fs");

module.exports = {
  entry: "./src/index.js",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: {
          presets: [
            "@babel/env",
            "@babel/react",
            {
              plugins: ["@babel/plugin-proposal-class-properties"],
            },
          ],
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ["file-loader"],
      },
      {
        test: require.resolve("THREE"),
        use: [
          {
            loader: "expose-loader",
            options: "THREE",
          },
        ],
      },
    ],
  },
  resolve: { extensions: ["*", ".js", ".jsx"] },
  output: {
    path: path.resolve(__dirname, "dist/"),
    publicPath: "/dist/",
    filename: "bundle.js",
    library: "Lincoln3D",
    // libraryTarget: "umd2"
  },
  devServer: {
    contentBase: path.join(__dirname, "public/"),
    port: 8080,
    publicPath: "http://localhost:80/dist/",
    hotOnly: true,
    // host: "192.168.18.4", // local domain entry set in HOSTS file
    // host: "dj.bighappy.co", // local domain entry set in HOSTS file
    // http2: true,
    // https: {
    //   key: fs.readFileSync("./ssl/bighappy_co.key"),
    //   cert: fs.readFileSync("./ssl/STAR_bighappy_co.crt"),
    //   ca: fs.readFileSync("./ssl/STAR_bighappy_co.ca-bundle"),
    // },
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      THREE: "three/build/three.module.js",
    }),
  ],
};
