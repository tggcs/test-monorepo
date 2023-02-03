const utils = require('tgtest-utils')

const getButton = () => {
  return `<button>${utils.getDayInfo()}</button>` 
}

module.exports = {
  getButton,
};