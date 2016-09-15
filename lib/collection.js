'use strict';

const fs = require('fs');
const path = require('path');

const _queryItems = Symbol('queryItems');
const _findWithOptions = Symbol('findWithOptions');
const _sortByKey = Symbol('sortByKey');
const _syncCollection = Symbol('syncCollection');
const _defaultData = Symbol('defaultData');

class Collection {
  constructor(collectionName, collectionPath, collectionData) {
    this.name = collectionName;
    this.collection = collectionData || this[_defaultData](collectionName, collectionPath);

    this[_syncCollection]();
  }

  find(query, options) {
    return Promise.resolve(this[_findWithOptions](query, options));
  }

  findOne(query, options) {
    return Promise.resolve(this[_findWithOptions](query, options)[0]);
  }

  count() {
    return Promise.resolve(this.collection.items.length);
  }

  insert(items) {
    const id = this.collection.nextID;

    const newItems = items.map((item, index) => {
      return Object.assign({}, { id: id + index }, item);
    });

    this.collection.items = this.collection.items.concat(newItems);
    this.collection.nextID = id + items.length;

    this[_syncCollection]();

    return Promise.resolve(newItems);
  }

  insertOne(item) {
    const id = this.collection.nextID;
    const newItem = Object.assign({}, { id }, item);

    this.collection.items = this.collection.items.concat(newItem);
    this.collection.nextID++;

    this[_syncCollection]();

    return Promise.resolve(newItem);
  }

  updateOne(query, data) {
    if (!query) {
      return Promise.reject('You must specify a query to update an item.');
    }

    const items = this.collection.items;
    const queryResult = this[_queryItems](query, items)[0];

    if (!queryResult || !queryResult.id) {
      return Promise.reject('Didn\'t find any items to remove.');
    }

    const updatedItem = Object.assign({}, data, { id: queryResult.id });

    this.collection.items = items.filter(i => i.id !== queryResult.id).concat(updatedItem);

    this[_syncCollection]();

    return Promise.resolve(updatedItem);
  }

  removeOne(query) {
    if (!query) {
      return Promise.reject('You must specify a query to remove an item.');
    }

    const items = this.collection.items;
    const queryResult = this[_queryItems](query, items)[0];

    if (!queryResult || !queryResult.id) {
      return Promise.reject('Didn\'t find any items to remove.');
    }

    this.collection.items = items.filter(i => i.id !== queryResult.id);

    this[_syncCollection]();

    return Promise.resolve(queryResult);
  }

  [_queryItems](query, items) {
    const queryKeys = Object.keys(query);

    if (queryKeys.length === 0) {
      return items;
    }

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

    return newItems;
  }

  [_sortByKey](key) {
    return (a, b) => {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    }
  }

  [_findWithOptions](query = {}, options = {}) {
    const sortKey = options.sort ? options.sort : null;
    const newItems = this[_queryItems](query, this.collection.items);

    return sortKey ? newItems.sort(this[_sortByKey](sortKey)) : newItems;
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
