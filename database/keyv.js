const Keyv = require("keyv");

const DB_TABLE =
  process.env.NODE_ENV !== "production" ? "develop" : "production";

console.log(process.env.DATABASE_URL);

const keyv = new Keyv(process.env.DATABASE_URL, { table: DB_TABLE });

keyv.on("error", (err) => console.error("Keyv connection error:", err));

module.exports = keyv;
// module.exports = {
//   get: () => {},
//   set: () => {},
// };
