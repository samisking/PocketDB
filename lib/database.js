'use strict';

const fs = require('fs');
const path = require('path');
const { Collection } = require('./collection');

const _getCollectionPath = Symbol('getCollectionPath');
const _getCollectionData = Symbol('getCollectionData');

class Database {
  constructor(pathToDB) {
    this.dbPath = pathToDB;
    this.db = {};

    // If the db path doesn't exist, then create it
    if (!fs.existsSync(this.dbPath)) {
      console.log(`Creating a new DB @ ${this.dbPath}`);
      fs.mkdirSync(this.dbPath);
    }
  }

  loadCollection(collectionName) {
    console.log('loading a collection');
    // Return the collection if it's already loaded
    if (this.db[collectionName]) {
      return this.db[collectionName];
    }

    const collectionPath = this[_getCollectionPath](collectionName);

    // If the collection isn't loaded, then check if the db file exists and load it if it does
    if (fs.existsSync(collectionPath)) {
      const collectionData = this[_getCollectionData](collectionName);

      this.db[collectionName] = new Collection(collectionName, collectionPath, collectionData);

      return this.db[collectionName];
    }

    // Otherwise just create a new collection and load it
    this.db[collectionName] = new Collection(collectionName, collectionPath);

    return this.db[collectionName];
  }

  removeCollection(collectionName) {
    // Reject if you try and remove a non-existing collection
    if (!this.db[collectionName]) {
      return Promise.reject(`A collection "${collectionName}" does not exist.`);
    }

    // Remove the db file, then unload it from the db
    fs.unlinkSync(this[_getCollectionPath](collectionName));
    delete this.db[collectionName];

    return Promise.resolve();
  }

  [_getCollectionPath](collectionName) {
    return path.join(this.dbPath, `${collectionName}.db`);
  }

  [_getCollectionData](collectionName) {
    return JSON.parse(fs.readFileSync(this[_getCollectionPath](collectionName)), 'utf8');
  }
}

module.exports = {
  Database
};
