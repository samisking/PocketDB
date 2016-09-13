'use strict';

const fs = require('fs');
const path = require('path');
const { sortByKey } = require('./utils');

const _getCollectionPath = Symbol('getCollectionPath');
const _getCollection = Symbol('getCollection');
const _find = Symbol('find');
const _syncCollection = Symbol('syncCollection');
const _initialCollectionData = Symbol('initialCollectionData');

class PocketDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = {};

    // If the db path doesn't exist, then create it
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath);
    }
  }

  loadCollection(collectionName) {
    // Return if we already have a collection with that name
    if (fs.existsSync(this[_getCollectionPath](collectionName))) {
      console.warn(`A collection called ${collectionName} exists already.`);
      // Also add the data to the class so we can access it without reading again
      this.db[collectionName] = this[_getCollection](collectionName);
      return Promise.resolve(this.db[collectionName]);
    }

    // Get the default collection values and create a new collection file
    this.db[collectionName] = this[_initialCollectionData](collectionName);
    this[_syncCollection](collectionName);
    return Promise.resolve(this.db[collectionName]);
  }

  find(collectionName, query) {
    return Promise.resolve(this[_find](collectionName, query));
  }

  findOne(collectionName, query) {
    return Promise.resolve(this[_find](collectionName, query)[0]);
  }

  insert(collectionName, data) {
    const id = this.db[collectionName].nextID;
    const newItem = Object.assign({}, { id }, data);

    // Add the new data to the collections items
    this.db[collectionName].items = [...this.db[collectionName].items, newItem];

    // Increment the next ID
    this.db[collectionName].nextID++;

    // Sync the collection to the collection file
    this[_syncCollection](collectionName);

    return Promise.resolve(newItem);
  }

  update(collectionName, id, data) {
    const items = this.db[collectionName].items;
    const item = items.find(i => i.id === id);
    const newItem = Object.assign({}, { id: item.id }, data);

    this.db[collectionName].items = items.filter(i => i.id !== id).concat(newItem);
    this[_syncCollection](collectionName);

    return Promise.resolve(newItem);
  }

  remove(collectionName, id) {
    const items = this.db[collectionName].items;
    this.db[collectionName].items = items.filter(i => i.id !== id);
    this[_syncCollection](collectionName);
    return Promise.resolve(id);
  }

  [_find](collectionName, query) {
    const items = this.db[collectionName].items;

    if (query) {
      const queryKeys = Object.keys(query);
      const newItems = items.filter(item => {
        let matches = 0;

        for (const key of queryKeys) {
          if (item[key] && item[key] === query[key]) matches++;
        }

        if (queryKeys.length === matches) {
          return true;
        }

        return false;
      });

      return newItems.sort(sortByKey(id));
    }

    return items;
  }

  [_getCollectionPath](collectionName) {
    return path.join(this.dbPath, `${collectionName}.db`);
  }

  [_getCollection](collectionName) {
    return JSON.parse(fs.readFileSync(this[_getCollectionPath](collectionName)), 'utf8');
  }

  [_syncCollection](collectionName) {
    const data = this.db[collectionName];
    fs.writeFileSync(data.path, JSON.stringify(data));
  }

  [_initialCollectionData](collectionName) {
    return {
      path: this[_getCollectionPath](collectionName),
      name: collectionName,
      nextID: 1,
      items: []
    };
  }
}

module.exports = {
  PocketDB
};
