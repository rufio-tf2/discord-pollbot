const Keyv = require("keyv");
const sqlite3 = require("sqlite3").verbose();

const databaseName = "slapBotDatabase";
const pathToDatabase = `./database/${databaseName}`;

const database = new sqlite3.Database(pathToDatabase, (error) => {
  if (error) {
    return console.error(
      `Error creating database \`${databaseName}\``,
      error.message
    );
  }

  console.log(`Successful connection to the database \`${databaseName}\``);
});

const keyv = new Keyv(`sqlite://${pathToDatabase}`);

keyv.on("error", (err) => console.error("Keyv connection error:", err));

module.exports = keyv;
