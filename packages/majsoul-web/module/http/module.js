const path = require('path')

function httpModule(moduleOptions) {
  const defaultOption = {
    needTrim: true,
    timeout: 20000,
    messageDebounceTime: 100,
  }
  const options = Object.assign({}, defaultOption, moduleOptions)
  this.addPlugin({
    src: path.resolve(__dirname, 'plugin.js'),
    options,
  })
}
module.exports = httpModule
