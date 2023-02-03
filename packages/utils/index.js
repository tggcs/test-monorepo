const dayjs = require("dayjs");

const getDayInfo = () => dayjs().format()

const getHello = () => 'hello'

module.exports = {
  getDayInfo,
  getHello
};