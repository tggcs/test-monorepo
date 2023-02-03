const utils = require('utils')

const getButton = () => {
  return `<button>${utils.getDayInfo()}</button>` 
}

module.exports = {
  getButton,
};