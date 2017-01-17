const atomic = require('atomic-write');
const { PocketDB } = require('./pocketdb');

const _queryItems = Symbol('queryItems');
const _findWithOptions = Symbol('findWithOptions');
const _sortByKey = Symbol('sortByKey');
const _syncCollection = Symbol('syncCollection');

class Collection {
  /**
   * @param {Class} db               A PocketDB instance.
   * @param {String} collectionName  The name of the collection.
   */
  constructor(db, collectionName) {
    // If the `db` arg is not a PocketDB instance, then throw an error
    if (!(db instanceof PocketDB)) {
      throw new TypeError('DB isn\'t a valid PocketDB instance.');
    }

    // If the db already has a collection with the same name, then throw an error
    if (db.db[collectionName]) {
      throw new Error('A collection with that name already exists.');
    }

    this.path = db.getCollectionPath(collectionName);
    this.name = collectionName;
    this.events = ['beforeSave', 'afterSave', 'beforeRemove', 'afterRemove'];
    this.listeners = [];

    // Set the collection to the data from disk if it exists, or default collection data
    this._collection = db.getCollectionData(collectionName);
    // And add the collection instance to the DB
    db.loadCollection(this);

    this[_syncCollection]();
  }

  /**
   * Finds all items in a collection given a query.
   *
   * @param  {Object|Function} query  A query object or .filter() function.
   * @param  {Object} options         A options object e.g. `{ sort: 'name' }`.
   * @return {Promise}                A list of found objects.
   */
  find(query, options) {
    return Promise.resolve(this[_findWithOptions](query, options));
  }

  /**
   * Finds the first item in a collection given a query.
   *
   * @param  {Object|Function} query  A query object or .filter() function.
   * @param  {Object} options         A options object e.g. `{ sort: 'name' }`.
   * @return {Promise}                The found object.
   */
  findOne(query, options) {
    return Promise.resolve(this[_findWithOptions](query, options)[0]);
  }

  /**
   * Counts the number of items in a collection given a query.
   *
   * @param  {Object|Function} query  A query object or .filter() function.
   * @param  {Object} options         A options object e.g. `{ sort: 'name' }`.
   * @return {Promise}                The total count of items in a collection.
   */
  count(query, options) {
    return Promise.resolve(this[_findWithOptions](query, options).length);
  }

  /**
   * Method called before all insert operations.
   * It allows you to change some data before it's inserted.
   *
   * @param  {Object|Array} data  The data to do things with.
   * @return {Object|Array}       The data that's been changed.
   */
  preInsert(data) {
    return data;
  }

  /**
   * Method called after all insert operations.
   * It gives you access to the object after it was saved to the collection.
   *
   * @param  {Object|Array} data  The data to do things with.
   * @return {Object|Array}
   */
  postInsert(data) {
    return data;
  }

  /**
   * Insert multiple items into the DB.
   *
   * @param  {Array} items  A list of items to insert.
   * @return {Array}        The items that were inserted.
   */
  insert(items) {
    if (!Array.isArray(items)) {
      return Promise.reject(new Error('You must pass a valid array to `.insert()`.'));
    }

    const id = this._collection.nextID;
    const data = items.map((item, index) => Object.assign({}, { id: id + index }, item));

    // Create a list of new items by calling the preInsert hook
    // with the list of items to be inserted
    const newItems = this.preInsert(data);
    this.emit('beforeSave', { original: items, modified: newItems });

    this._collection.items = [...this._collection.items, ...newItems];
    this._collection.nextID = id + items.length;

    this.postInsert(newItems);
    this.emit('afterSave', { original: items, modified: newItems });

    this[_syncCollection]();

    return Promise.resolve(newItems);
  }

  /**
   * Insert a single item into the DB.
   *
   * @param  {Object} item  An item to insert.
   * @return {Object}       The item that was inserted.
   */
  insertOne(item) {
    const id = this._collection.nextID;
    const data = Object.assign({}, { id }, item);

    // Create a new item by calling the preInsert hook with the new data
    const newItem = this.preInsert(data);
    this.emit('beforeSave', { original: item, modified: newItem });

    this._collection.items = [...this._collection.items, newItem];
    this._collection.nextID++;

    this.postInsert(newItem);
    this.emit('afterSave', { original: item, modified: newItem });

    this[_syncCollection]();

    return Promise.resolve(newItem);
  }

  /**
   * Method called before all update operations.
   * It allows you to change some data before it's inserted.
   *
   * @param  {Object|Array} data  The data to do things with.
   * @return {Object|Array}       The data that's been changed.
   */
  preUpdate(data) {
    return data;
  }

  /**
   * Method called after all update operations.
   * It gives you access to the object after it was saved to the collection.
   *
   * @param  {Object|Array} data  The data to do things with.
   * @return {Object|Array}
   */
  postUpdate(data) {
    return data;
  }

  /**
   * Updates a single item into the DB.
   * The update isn't merged with the existing item, meaning the
   * existing item will be overwritten with exception to the `id` key.
   *
   * @param  {Object|Function} query  A query object or .filter() function.
   * @param  {Object} data            The new data to update with.
   * @return {Object}                 The item that was updated.
   */
  updateOne(query, data) {
    if (!query) {
      return Promise.reject(new Error('You must specify a query to update an item.'));
    }

    const items = this._collection.items;
    const queryResult = this[_queryItems](query, items)[0];

    // If it didn't find any items to update, then reject
    if (!queryResult || !queryResult.id) {
      return Promise.reject(new Error('Didn\'t find any items to update.'));
    }

    // Construct the new item to be saved
    const withPreUpdate = this.preUpdate(Object.assign({}, queryResult, data));
    const updatedItem = Object.assign({}, withPreUpdate, { id: queryResult.id });

    this.emit('beforeSave', { original: queryResult, modified: updatedItem });

    // And save it to the collection by removing the existing item and appending the update
    this._collection.items = [...items.filter(i => i.id !== queryResult.id), updatedItem];

    this.postUpdate(updatedItem);
    this.emit('afterSave', { original: queryResult, modified: updatedItem });

    this[_syncCollection]();

    return Promise.resolve(updatedItem);
  }

  /**
   * Method called before all remove operations.
   * It gives you access to the object before it gets removed from the collection.
   *
   * @param  {Object|Array} data  The data to do things with.
   * @return {Object|Array}
   */
  preRemove(data) {
    return data;
  }

  /**
   * Method called after all remove operations.
   * It gives you access to the object after it was removed from the collection.
   *
   * @param  {Object|Array} data  The data to do things with.
   * @return {Object|Array}
   */
  postRemove(data) {
    return data;
  }

  /**
   * Removes a list of items that match a given query from the DB.
   * If no query is provided, then all items are removed and the counter is reset.
   *
   * @param  {Object|Function} query  A query object or .filter() function.
   * @return {Promise}                The items that were removed.
   */
  remove(query) {
    const items = this._collection.items;

    if (!query) {
      this._collection.items = [];
      this._collection.nextID = 1;

      this[_syncCollection]();

      return Promise.resolve(items);
    }

    const queryResult = this[_queryItems](query, items);

    if (!queryResult || !queryResult.length) {
      return Promise.reject(new Error('Didn\'t find any items to remove.'));
    }

    this._collection.items = items.filter(i => !queryResult.includes(i));

    this[_syncCollection]();

    return Promise.resolve(queryResult);
  }

  /**
   * Removes a single item from the DB.
   *
   * @param  {Object|Function} query  A query object or .filter() function.
   * @return {Object}                 The item that was updated.
   */
  removeOne(query) {
    if (!query) {
      return Promise.reject(new Error('You must specify a query to remove an item.'));
    }

    const items = this._collection.items;
    const queryResult = this[_queryItems](query, items)[0];

    if (!queryResult || !queryResult.id) {
      return Promise.reject(new Error('Didn\'t find any items to remove.'));
    }

    this.preRemove(queryResult);
    this.emit('beforeRemove', { original: queryResult, modified: queryResult });

    this._collection.items = items.filter(i => i.id !== queryResult.id);

    this.postRemove(queryResult);
    this.emit('afterRemove', { original: queryResult, modified: queryResult });

    this[_syncCollection]();

    return Promise.resolve(queryResult);
  }

  /**
   * Adds a listener to the collection so other things can observe certain events.
   *
   * @param  {String} eventName   The naem of the event to listen for.
   * @param  {Function} listener  A listener function to be called when events are emitted.
   * @param  {String} id          A unique identifier for a listener. Used by `removeListener(id)`.
   */
  addListener(eventName, listener, id) {
    if (!this.events.includes(eventName)) {
      throw new Error(
        `${eventName} is not a valid event name. Event names are: ${this.events.join(', ')}`
      );
    }

    if (this.listeners.find(l => (l.id === id && l.eventName === eventName))) {
      throw new Error(`A listener for "${eventName}" with id "${id}" already exists.`);
    }

    this.listeners.push({
      eventName,
      listener,
      id
    });
  }

  /**
   * Removes a listener from the collection.
   *
   * @param  {String} id  The ID of the listener to remove.
   */
  removeListener(id) {
    this.listeners = this.listeners.filter(l => l.id !== id);
  }

  /**
   * Calls each listener function for a given event with some data.
   *
   * @param {String} eventName  The event to listen for.
   * @param {Array} args        Any args that should be passed to the listener.
   */
  emit(eventName, data) {
    const listeners = this.listeners.filter(l => l.eventName === eventName);

    for (const listener of listeners) {
      listener.listener(data);
    }
  }

  /**
   * Searches a list of items for a given query and returns a copy of the result.
   *
   * @param  {Object|Function} query  A query object or .filter() function.
   * @param  {Array} items            The list of items to search within.
   * @return {Array}                  The results of the query.
   */
  [_queryItems](query, items) {
    // If the query arg is a filter function, then apply it and return the result
    if (query.constructor && query.call && query.apply) {
      return items.filter(query);
    }

    const queryKeys = Object.keys(query);

    // If the query is an empty object, just return a copy of the un filtered items
    if (queryKeys.length === 0) {
      return [...items];
    }

    // Search for and return the items that match the query object
    return items.filter(item => {
      let matches = 0;

      // Check if any of the key/values in the query match any the items key/values
      for (const key of queryKeys) {
        if (item[key] && item[key] === query[key]) matches++;
      }

      // If the item matched on all the query key/values the return it
      if (queryKeys.length === matches) {
        return true;
      }

      return false;
    });
  }

  /**
   * .sort() function that sorts items by a given key.
   *
   * @param  {String} key  The key to sort by.
   * @return {Function}    A function that .sort() will accept.
   */
  [_sortByKey](key) {
    const reverse = key.startsWith('-');
    const k = reverse ? key.replace('-', '') : key;

    if (reverse) {
      return (a, b) => {
        if (a[k] < b[k]) return 1;
        if (a[k] > b[k]) return -1;
        return 0;
      };
    }

    return (a, b) => {
      if (a[k] < b[k]) return -1;
      if (a[k] > b[k]) return 1;
      return 0;
    };
  }

  /**
   * Finds items in the collection that match a query and optionally sorts them.
   *
   * @param  {Object|Function} query  A query object or .filter() function.
   * @param  {Object} options         A options object e.g. `{ sort: 'name' }`.
   * @return {Array}                  The list of found items, optionally sorted.
   */
  [_findWithOptions](query = {}, options = {}) {
    const sortKey = options.sort ? options.sort : null;
    const newItems = this[_queryItems](query, this._collection.items);

    return sortKey ? newItems.sort(this[_sortByKey](sortKey)) : newItems;
  }

  /**
   * Saves the current collection state to disk.
   */
  [_syncCollection]() {
    atomic.writeFile(this.path, JSON.stringify(this._collection), () => {});
  }
}

module.exports = {
  Collection
};
