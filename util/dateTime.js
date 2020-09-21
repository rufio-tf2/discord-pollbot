const dateFns = require("date-fns");

const { isString } = require("./util");

const formatDateShort = (time) => {
  const date = isString(time) ? new Date(time) : time;
  return dateFns.format(date, "MM/dd/yyyy");
};

module.exports = {
  formatDateShort,
};
