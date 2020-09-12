const Keyv = require("keyv");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs-extra");

const DATABASE_NAME = "SlapBotDatabase";

const DATABASE_DIR = "./database/db/";
const PATH_TO_DATABASE = `${DATABASE_DIR}/${DATABASE_NAME}`;

fs.ensureDirSync(DATABASE_DIR);

const database = new sqlite3.Database(PATH_TO_DATABASE, (error) => {
  if (error) {
    return console.error(
      `Error creating database \`${DATABASE_NAME}\``,
      error.message
    );
  }

  console.log(`Successful connection to the database \`${DATABASE_NAME}\``);
});

const keyv = new Keyv(`sqlite://${PATH_TO_DATABASE}`);

keyv.on("error", (err) => console.error("Keyv connection error:", err));

module.exports = keyv;
