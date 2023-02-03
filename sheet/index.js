const ui = require('ui')
const utils = require('utils')

const render = () => {
  return `${ui.getButton()}.${utils.getHello()}` 
}

module.exports = {
  render,
};