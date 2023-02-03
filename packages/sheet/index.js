const ui = require('tgtest-ui')
const utils = require('tgtest-utils')

const render = () => {
  return `${ui.getButton()}.${utils.getHello()}` 
}

module.exports = {
  render,
};