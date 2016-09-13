# PocketDB

> A relatively small ES6 Class based DB, that saves to disk.

**This is very much a work in progress so changes to the API will happen frequently. Not production ready.**

## Install

```
npm install --save pocketdb
```

You can then require/import it in your project, and create a new DB at a given path.

```js
import { PocketDB } from 'pocketdb';

const db = new PocketDB('./db');
```

## API

Every method on `PocketDB` should return a promise with some data so you can chain operations.

### Load Collections

**db.loadCollection([collection])**

Collections are the main way you interact with Pocket. You first load a collection and add items to it. If a collection doesn't exist, a new one will be created. This will make a new `${collectionName}.db` file inside the DB folder you create.

```js
const db = new PocketDB('./db');

db.loadCollection('photos').then(() => {
  console.log('Photos collection was loaded/created.');
});
```

The contents of `./db/photos.db` will now look something like this:

```
{"path":"./db/photos.db","name":"photos","nextID":1,"items":[]}
```

### Inserting Items

**db.insert([collection, {data}])**

Inserting a new item will automatically increment the ID. If you'd like to overwrite this, just pass an `id` key in the data you're inserting.

```js
db.insert('photos', { name: 'Jon Doe', age: 24 }).then(insertedItem => {});
```

### Finding Items

**db.find([collection, {query}])**

Find all items that match a certain query. Only items that have _all_ the same key/value pairs as `query` will be returned. If a query isn't specified, then all items in the collection are returned.

```js
// If our collection.items looked like this…
// items: [
//   { id: 1, name: 'John', age: 24, profession: 'Designer' },
//   { id: 2, name: 'Lisa', age: 28, profession: 'Developer' },
//   { id: 3, name: 'Amie', age: 22, profession: 'Developer' },
//   { id: 4, name: 'Doug', age: 34, profession: 'Designer' },
//   { id: 5, name: 'Nora', age: 67, profession: 'Retired' },
//   { id: 6, name: 'Mark', age: 24, profession: 'Designer' }
// ]

db.find('collection').then(result => {
  // result = Array of the full data set
});

db.find('collection', { name: 'John' }).then(result => {
  // result = [{ id: 1, name: 'John', age: 24, profession: 'Designer' }]
});

db.find('collection', { age: 24, profession: 'Designer' }).then(result => {
  // result = [
  //   { id: 1, name: 'John', age: 24, profession: 'Designer' },
  //   { id: 6, name: 'Mark', age: 24, profession: 'Designer' }
  // ]
});

db.find('collection', { age: 51 }).then(result => {
  // result = [];
});
```

**db.findOne([collection, {query}])**

The same as `.find()` but it just returns the first result.

### Updating Items

**db.update([collection, id, {data}])**

Updates an item with a given id (id will soon be replaced with a query similar to `.findOne()`). Note, your data **will not** be merged. The entire item will be overwritten except the `id` which stays the same. It's recommended to first `.find().then()` update so you can construct the new item with any existing data.

```js
db.update('photos', 1, { name: 'Sally' }).then(updatedItem => {});
```

### Deleting Items

**db.remove([collection, id])**

Removes an item with a given id (id will soon be replaced with a query similar to `.find()`).

```js
db.remove('photos', 1).then(id => {});
```

## TODO

- [ ] TESTS!
- [ ] Simplify collections.
- [ ] Make `.remove()` use a query like `.find()`.
