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

## DB API

Every method on `PocketDB` returns a promise with some data so you can chain operations. The only exception is `.loadCollection()` which is synchronous for now.

### Loading a Collection

**db.loadCollection([collection])**

Collections are the main way you interact with Pocket. You first load a collection and then call methods on it. If a collection doesn't exist, a new one will be created. This will make a new `${collectionName}.db` file inside the DB folder you create.

```js
const collection = db.loadCollection('people');
// You can now call methods on the `people` collection
```

The contents of `./db/people.db` will now look something like this:

```
{"path":"./db/people.db","name":"people","nextID":1,"items":[]}
```

### Removing a Collection

**db.removeCollection([collection])** | _Returns a Promise_

Removes an entire collection, including the `.db` file.

```js
db.removeCollection('people').then(() => {});
```

## Collection API

### Inserting Items

**collection.insertOne([{data}])** | _Returns a Promise_

Inserting a new item will automatically increment the ID. If you'd like to overwrite this, just pass an `id` key in the data you're inserting.

```js
collection.insertOne({ name: 'Jon Doe', age: 24 }).then(insertedItem => {});
```

**collection.insert([[{data}]])** | _Returns a Promise_

Inserting a lot of items can be slow if you insert them one by one. If you want to insert a lot of items, use this with an array of items you want to insert.

```js
const items = [{ name: 'John' }, { name: 'Lisa'}, { name: 'Amie'}];
collection.insert(items).then(insertedItems => {});
```

### Finding Items

**collection.find([{query}, {options}])** | _Returns a Promise_

Find all items that match a certain query. Only items that match _all_ of the key/value pairs from `{query}` will be returned. If a query isn't specified, or it's empty, then all items in the collection are returned.

You can also pass options to the query. Currently the supported options are:
- `{ sort: 'key' }`: This will sort the items returned by the key you provide.

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

collection.find().then(result => {
  // result = Array of the full data set
});

collection.find({ name: 'John' }).then(result => {
  // result = [{ id: 1, name: 'John', age: 24, profession: 'Designer' }]
});

collection.find({ age: 24, profession: 'Designer' }).then(result => {
  // result = [
  //   { id: 1, name: 'John', age: 24, profession: 'Designer' },
  //   { id: 6, name: 'Mark', age: 24, profession: 'Designer' }
  // ]
});

collection.find({ profession: 'Developer' }, { sort: 'age' }).then(result => {
  // result = [
  //   { id: 3, name: 'Amie', age: 22, profession: 'Developer' },
  //   { id: 2, name: 'Lisa', age: 28, profession: 'Developer' }
  // ]
});

collection.find({ age: 51 }).then(result => {
  // result = [];
});
```

**collection.findOne([collection, {query}])** | _Returns a Promise_

This is the same as `.find()` but it just returns the first result.

### Updating Items

**collection.updateOne([{query}, {data}])** | _Returns a Promise_

Updates an item that matches your `{query}` (similar to `.find()`). Note, your data **will not** be merged. The entire item will be overwritten except for the `id` which stays the same.

```js
collection.updateOne({ id: 1 }, { name: 'Sally' }).then(updatedItem => {});
```

### Removing Items

**collection.removeOne([{query}])** | _Returns a Promise_

Removes an item that matches your `query` (similar to `.find()`).

```js
collection.remove({ id: 1 }).then(removedItem => {});
```

### Counting Items

**collection.count()** | _Returns a Promise_

If you want to count items in a collection without loading them, then use `.count()`.

```js
collection.count().then(count => {
  // count = <Number> of items
});
```

## Benchmarks

I've created a _very_ basic benchmark script that times all the methods. You can run it passing in a number of records you want to work with. For `.findOne()` and similar queries, the item in the middle of the array is queried for so it's a bit fairer.

```
node benchmark 5000
```

Below is an average of a few tests run on a 2014 MacBook Pro with a 2.8 GHz Intel Core i7 CPU and 16 GB 1600 MHz DDR3 RAM on OSX 10.11.5.

**Time taken to process x number of objects.**

| Method                   | 100 objs  | 2,500 objs  | 10,000 objs | 100,000 objs | 1,000,000 objs |
| ------------------------ | --------- | ----------- | ------------| ------------ | -------------- |
| `cl.insert([{data}])`    | 1.085 ms  | 6.163 ms    | 14.913 ms   | 214.257 ms   | 1919.604 ms    |
| `cl.find()`              | 0.271 ms  | 0.245 ms    | 0.219 ms    | 0.268 ms     | 0.232 ms       |
| `cl.find({query})`       | 0.348 ms  | 2.654 ms    | 6.880 ms    | 31.724 ms    | 507.379 ms     |
| `cl.find({}, {sort})`    | 0.989 ms  | 2.627 ms    | 7.768 ms    | 168.518 ms   | 1886.039 ms    |
| `cl.findOne()`           | 0.092 ms  | 0.052 ms    | 0.079 ms    | 0.115 ms     | 0.155 ms       |
| `cl.findOne({query})`    | 0.315 ms  | 0.958 ms    | 2.561 ms    | 42.516 ms    | 349.104 ms     |
| `cl.findOne({}, {sort})` | 0.067 ms  | 2.148 ms    | 14.651 ms   | 228.968 ms   | 2545.065 ms    |
| `cl.count()`             | 0.126 ms  | 0.077 ms    | 0.096 ms    | 0.120 ms     | 0.126 ms       |
| `cl.update()`            | 0.554 ms  | 3.176 ms    | 7.744 ms    | 125.374 ms   | 1060.500 ms    |
| `cl.removeOne({query})`  | 0.287 ms  | 3.308 ms    | 12.113 ms   | 129.805 ms   | 1531.280 ms    |
| `cl.insertOne({data})`   | 0.183 ms  | 1.368 ms    | 5.413 ms    | 78.838 ms    | 998.618 ms     |
| `db.removeCollection()`  | 0.199 ms  | 0.412 ms    | 1.145 ms    | 2.014 ms     | 4.006 ms       |
| File size                | 0.00818MB | 0.218184 MB | 0.88569 MB  | 9.255695 MB  | 96.5557 MB     |

## TODO

- [ ] TESTS!
- [x] Make collections simpler to interact with.
- [x] Make `.remove()` use a query like `.find()`.
