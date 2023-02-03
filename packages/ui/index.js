const utils = require('@ai/utils')

const getButton = () => {
  return `<button>${utils.getDayInfo()}</button>` 
}

module.exports = {
  getButton,
};