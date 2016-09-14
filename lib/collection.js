'use strict';

const fs = require('fs');
const path = require('path');
const { sortByKey } = require('./utils');

const _findInCollection = Symbol('findInCollection');
const _syncCollection = Symbol('syncCollection');
const _defaultData = Symbol('defaultData');

class Collection {
  constructor(collectionName, collectionPath, collectionData) {
    this.name = collectionName;
    this.collection = collectionData || this[_defaultData](collectionName, collectionPath);

    this[_syncCollection]();
  }

  find(query, options) {
    return Promise.resolve(this[_findInCollection](query, options));
  }

  findOne(query, options) {
    return Promise.resolve(this[_findInCollection](query, options)[0]);
  }

  count() {
    return Promise.resolve(this.collection.items.length);
  }

  insert(item) {
    const id = this.collection.nextID;
    const newItem = Object.assign({}, { id }, item);

    this.collection.items = this.collection.items.concat(newItem);
    this.collection.nextID++;

    this[_syncCollection]();

    return Promise.resolve(newItem);
  }

  insertMany(items) {
    const id = this.collection.nextID;

    const newItems = items.map((item, index) => {
      return Object.assign({}, { id: id + index }, item);
    });

    this.collection.items = this.collection.items.concat(newItems);
    this.collection.nextID = id + items.length;

    this[_syncCollection]();

    return Promise.resolve(newItems);
  }

  update(id, data) {
    const items = this.collection.items;
    const item = items.find(i => i.id === id);
    const newItem = Object.assign({}, { id: item.id }, data);

    this.collection.items = items.filter(i => i.id !== id).concat(newItem);

    this[_syncCollection]();

    return Promise.resolve(newItem);
  }

  remove(id) {
    const items = this.collection.items;

    this.collection.items = items.filter(i => i.id !== id);

    this[_syncCollection]();

    return Promise.resolve(id);
  }

  [_findInCollection](query, options = {}) {
    const items = this.collection.items;
    const sortKey = options.sortBy;

    if (!query) {
      return sortKey ? items.sort(sortByKey(sortKey)) : items;
    }

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

    return sortKey ? newItems.sort(sortByKey(sortKey)) : newItems;
  }

  [_syncCollection]() {
    fs.writeFileSync(this.collection.path, JSON.stringify(this.collection));
  }

  [_defaultData](collectionName, collectionPath) {
    return {
      path: collectionPath,
      name: collectionName,
      nextID: 1,
      items: []
    };
  }
}

module.exports = {
  Collection
};
