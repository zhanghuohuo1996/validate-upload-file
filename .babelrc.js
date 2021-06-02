/*
 * @Author: your name
 * @Date: 2021-04-17 13:57:58
 * @LastEditTime: 2021-06-01 18:54:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /validate-upload-file/.babelrc.js
 */
// 这里通过cross-env注入不同执行变量来确定babel转码成不同的格式es和commonjs
const { NODE_ENV, BABEL_ENV } = process.env
const cjs = NODE_ENV === 'test' || BABEL_ENV === 'commonjs'
const loose = true

module.exports = {
  // 设置modules:false来避免babel转换成commonjs之后rollup执行会报错
  presets: [['@babel/preset-env', { loose, modules: false }]],
  plugins: [
    ['@babel/proposal-decorators', { legacy: true }],
    ['@babel/proposal-object-rest-spread', { loose }],
    ['@babel/helper-create-regexp-features-plugin'],
    // 对jsx语法进行转换
    '@babel/transform-react-jsx',
    cjs && ['@babel/transform-modules-commonjs', { loose }],
    [
      '@babel/transform-runtime',
      {
        useESModules: !cjs,
        version: require('./package.json').dependencies[
          '@babel/runtime'
        ].replace(/^[^0-9]*/, '')
      }
    ],
    ["@babel/plugin-proposal-class-properties"]
  ].filter(Boolean)
}
