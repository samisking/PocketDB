'use strict';

const fs = require('fs');
const path = require('path');

const _getCollectionPath = Symbol('getCollectionPath');
const _getCollectionData = Symbol('getCollectionData');
const _defaultCollectionData = Symbol('defaultCollectionData');

class PocketDB {
  constructor(pathToDB) {
    this.dbPath = pathToDB;
    this.db = {};

    // If the db path doesn't exist, then create it
    if (!fs.existsSync(this.dbPath)) {
      console.log(`Creating a new DB @ ${this.dbPath}`);
      fs.mkdirSync(this.dbPath);
    }
  }

  getCollectionData(collectionName) {
    const collectionPath = this[_getCollectionPath](collectionName);

    // If the collection db file exists, then return that
    if (fs.existsSync(collectionPath)) {
      return this[_getCollectionData](collectionName);
    }

    // Otherwise return the default data
    return this[_defaultCollectionData](collectionName, collectionPath);
  }

  loadCollection(collection) {
    if (!collection || typeof collection !== 'object') {
      throw new TypeError('Trying to load an invalid collection.');
      return;
    }

    // Return the collection if it's already loaded
    if (this.db[collection.name]) {
      console.warn(`A collection called "${collection.name}" already exists. Connecting to the same collection.`);
      return;
    }

    // Otherwise set it to the collection arg
    this.db[collection.name] = collection;
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

  [_defaultCollectionData](collectionName, collectionPath) {
    return {
      path: collectionPath,
      name: collectionName,
      nextID: 1,
      items: []
    };
  }
}

module.exports = {
  PocketDB
};
