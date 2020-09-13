const { default: PQueue } = require("p-queue");
const promiseQueue = new PQueue({ concurrency: 1 });

module.exports = promiseQueue;
