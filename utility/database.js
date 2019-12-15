const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let db;

const mongoConnect = callback => {
  MongoClient.connect(
    "mongodb+srv://app:1111@cluster-roa0v.mongodb.net/shop?retryWrites=true&w=majority"
  ).then(client => {
    db = client.db();
    callback();
  });
};

const getDb = () => {
  if (db) {
    return db;
  }
  throw "No connection";
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
