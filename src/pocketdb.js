import fs from 'fs';
import path from 'path';

const _getCollectionData = Symbol('getCollectionData');
const _defaultCollectionData = Symbol('defaultCollectionData');

class PocketDB {
  constructor(pathToDB) {
    this.dbPath = pathToDB;
    this.db = {};

    // If the db path doesn't exist, then create it
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath);
    }
  }

  loadCollection(collection) {
    if (!collection || typeof collection !== 'object') {
      throw new TypeError('Trying to load an invalid collection.');
    }

    // Otherwise set it to the collection arg
    this.db[collection.name] = collection;
  }

  removeCollection(collectionName) {
    // Reject if you try and remove a non-existing collection
    if (!this.db[collectionName]) {
      throw new Error(`A collection "${collectionName}" does not exist.`);
    }

    delete this.db[collectionName];
  }

  getCollectionPath(collectionName) {
    return path.join(this.dbPath, `${collectionName}.db`);
  }

  getCollectionData(collectionName) {
    const collectionPath = this.getCollectionPath(collectionName);

    // If the collection db file exists, then return that
    if (fs.existsSync(collectionPath)) {
      return this[_getCollectionData](collectionName);
    }

    // Otherwise return the default data
    return this[_defaultCollectionData](collectionName);
  }

  [_getCollectionData](collectionName) {
    return JSON.parse(fs.readFileSync(this.getCollectionPath(collectionName)), 'utf8');
  }

  [_defaultCollectionData](collectionName) {
    return {
      name: collectionName,
      nextID: 1,
      items: [],
    };
  }
}

export default PocketDB;
