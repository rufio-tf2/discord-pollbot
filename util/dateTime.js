const dateFns = require("date-fns");

const { isString } = require("./util");

const formatTimeDistance = (time) => {
  const date = isString(time) ? new Date(time) : time;
  return dateFns.formatDistanceToNow(date, {
    includeSeconds: true,
  });
};

module.exports = {
  formatTimeDistance,
};
