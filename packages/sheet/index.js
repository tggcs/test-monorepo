const ui = require('@ai/ui')
const utils = require('@ai/utils')

const render = () => {
  return `${ui.getButton()}.${utils.getHello()}` 
}

module.exports = {
  render,
};