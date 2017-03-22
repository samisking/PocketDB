# PocketDB

> A relatively small ES6 Class based DB, that saves to disk.

**This is very much a work in progress so changes to the API will happen frequently. Not production ready.**

## Install

```
npm install --save pocketdb
```

You can then require/import it in your project, and create a new DB at a given path.

```js
import { PocketDB, Collection } from 'pocketdb';

const db = new PocketDB('./db');
```

## DB API

### Creating a Collection

**new Collection(db, collectionName)**

Collections are the main way you interact with Pocket. You create a new collection and then call methods on it. If a collection doesn't exist, a new one will be created. This will make a new `${collectionName}.db` file inside the DB folder you create.

You must pass an instance of `PocketDB` as the `db` argument.

```js
import { PocketDB, Collection } from 'pocketdb';

const db = new PocketDB('./db');
const collection = new Collection(db, 'people');
// You can now call methods on the `people` collection
```

The contents of `./db/people.db` will now look something like this:

```
{"path":"./db/people.db","name":"people","nextID":1,"items":[]}
```

Because collections are ES6 classes, you can extend them to add other functionality like static methods etc. This comes in really handy when you want to add custom hooks which are explained later in this doc.

### Removing a Collection

**db.removeCollection(collectionName)** | _Returns a Promise_

Removes an entire collection, including the `.db` file.

```js
db.removeCollection('people').then(() => {});
```

## Collection API

### Inserting Items

**collection.insertOne({data})** | _Returns a Promise with the inserted item_

Inserting a new item will automatically increment the ID. If you'd like to overwrite this, just pass an `id` key in the data you're inserting.

```js
collection.insertOne({ name: 'Jon Doe', age: 24 }).then(insertedItem => {});
```

**collection.insert([{data}])** | _Returns a Promise with all the inserted items_

Inserting a lot of items can be slow if you insert them one by one. If you want to insert a lot of items, use this with an array of items you want to insert.

```js
const items = [{ name: 'John' }, { name: 'Lisa'}, { name: 'Amie'}];
collection.insert(items).then(insertedItems => {});
```

### Finding Items

**collection.find(({query} || Function), {options})** | _Returns a Promise with all the found items_

Find all items that match a certain query object or [.filter() callback](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter#Parameters). If you supply a `{query}` object, only items that match _all_ of the key/value pairs in your `{query}` will be returned. If a query isn't specified, or it's empty, then all items in the collection are returned.

You can also pass options to the query. Currently the supported options are:
- `sort: String`: This will sort the items by the name of the key you provide. If your key starts with `-` then the order will be reversed.
- `limit: Number`: This will limit the number of results you'll get back.
- `skip: Number`: This will cut the number of results specified from the front of the array you get back.

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

collection.find({} { limit: 2, skip: 3 }).then(result => {
  // result = [
  //   { id: 4, name: 'Doug', age: 34, profession: 'Designer' },
  //   { id: 5, name: 'Nora', age: 67, profession: 'Retired' },
  // ]
});

collection.find({ age: 51 }).then(result => {
  // result = [];
});

collection.find(item => item.age > 25).then(result => {
  // result = [
  //   { id: 2, name: 'Lisa', age: 28, profession: 'Developer' },
  //   { id: 4, name: 'Doug', age: 34, profession: 'Designer' },
  //   { id: 5, name: 'Nora', age: 67, profession: 'Retired' }
  // ]
});
```

###### Find operators

You can use operators in your `{query}` similar to Mongo. They can be combined to make more complex queries. Only items that match all operators will be returned. The supported operators are:

- `$gt`: Greater than the value you specify. Works on anything that can be compared with `>`.
- `$gte`: Greater than or equal to the value you specify. Works on anything that can be compared with `>=`.
- `$lt`: Less than the value you specify. Works on anything that can be compared with `<`.
- `$lte`: Less than or equal to the value you specify. Works on anything that can be compared with `<=`.
- `$ne`: Not equal to the value you specify. Works on anything that can be compared with `!==`.
- `$in`: Includes the value you specify. Only works on `Array`s.
- `$nin`: Doesn't include the value you specify. Only works on `Array`s.
- `$length`: Length matches the value you specify. Only works on `Array`s.

```js
// items = [
//   { id: 1, name: 'Amie', age: 22, profession: 'Developer', tags: ['react', 'pocketdb', 'node'] },
//   { id: 2, name: 'John', age: 21, profession: 'Designer', tags: ['sketch'] },
//   { id: 3, name: 'Lisa', age: 19, profession: 'Developer', tags: ['react', 'node'] },
//   { id: 4, name: 'Doug', age: 21, profession: 'Developer' }
// ]
collection.find({ age: { $gt: 21, $lt: 23 } })).then(result => {
  // result = [
  //   { id: 1, ... }
  // ]
});

collection.find({ age: { $gte: 21, $lte: 25 } })).then(result => {
  // result = [
  //   { id: 1, ... }
  //   { id: 2, ... }
  //   { id: 4, ... }
  // ]
});

collection.find({ age: { $ne: 21 } })).then(result => {
  // result = [
  //   { id: 1, ... }
  //   { id: 3, ... }
  // ]
});

collection.find({ tags: { $in: 'sketch' } })).then(result => {
  // result = [
  //   { id: 2, ... }
  // ]
});

collection.find({ tags: { $nin: 'pocketdb' } })).then(result => {
  // result = [
  //   { id: 2, ... }
  //   { id: 3, ... }
  // ]
});

collection.find({ tags: { $length: 3 } })).then(result => {
  // result = [
  //   { id: 1, ... }
  // ]
});
```

**collection.findOne(({query} || Function), {options})** | _Returns a Promise with the found item_

This is the same as `collection.find()` but it just returns the first result.

_Note:_ The `limit` option will have no affect, but the `sort` and `skip` options will.

### Updating Items

**collection.updateOne(({query} || Function), {data})** | _Returns a Promise with the updated item_

Updates the first item that matches your `{query}` (similar to `collection.find()`). Note, your data **will not** be merged. The entire item will be overwritten except for the `id` which stays the same.

```js
collection.updateOne({ id: 1 }, { name: 'Sally', age: 29 }).then(updatedItem => {});
```

### Removing Items

**collection.remove(({query} || Function))** | _Returns a Promise with the removed items_

Removes all items that matches your `query` (similar to `collection.find()`).

```js
collection.remove(i => i.age < 18).then(removedItems => {});
```

**collection.removeOne(({query} || Function))** | _Returns a Promise with the removed item_

Removes the first item that matches your `query` (similar to `collection.find()`).

```js
collection.removeOne({ id: 1 }).then(removedItem => {});
```

### Counting Items

**collection.count(({query} || Function))** | _Returns a Promise with the collection count_

If you want to count items in a collection without loading them, then use `.count()`.

```js
collection.count().then(count => {
  // count = <Number> of items
});
```

## Hooks

PocketDB `Collection`'s provide some hooks that you can use to execute code before and after DB interactions. You can return values inside hook methods (currently `preInsert` and `preUpdate` are the only hooks that use the returned value). Hooks are also sync only for now. Returning promises is coming soon.

You create a hook by extending the `Collection` class and overriding the hook methods. The following is a list of currently implemented hooks and the methods that use them:

- `preInsert([data])` called by:
  - `.insertOne()` where `data` is the item about to be inserted.
  - `.insert()` where `data` is the list of items about to be inserted.
- `postInsert([data])` called by:
  - `.insertOne()` where `data` is the item that was inserted.
  - `.insert()` where `data` is the list of items that were inserted.
- `preUpdate([data])` called by:
  - `.updateOne()` where `data` is the item about to be inserted.
  - `update()` where `data` is the list of items about to be inserted.
- `postUpdate([data])` called by:
  - `.updateOne()` where `data` is the item that was inserted.
  - `update()` where `data` is the list of items that were inserted.
- `preRemove([data])` called by:
  - `.removeOne()` where `data` is the item about to be removed.
- `postRemove([data])` called by:
  - `.removeOne()` where `data` is the item that was removed.

Here's an example of a `preInsert` hook where you encrypt a password before saving it.

```js
class Users extends Collection {
  constructor(db, collectionName) {
    super(db, collectionName);
  }

  preInsert(item) {
    // Create a new object with the safe password
    const safeUser = Object.assign({}, item, {
      safePassword: encrypt(item.password) // pseudo encrypt function
    });

    // Remove the unsafe password
    delete safeUser.password;

    // And then return the safe user to be stored
    return safeUser;
  }
}

// Now you can create the collection and every time a new user is inserted,
// the inserted users password will be encrypted.
const users = new Users(db, 'users');

// Insert a user with an unsafe password
users.insertOne({ name: 'Sam', password: 'so-unsafe' });

// Now the user will have the safe password instead
users.findOne(i => i.name === 'Sam').then(res => {
  // {
  //   id: 1,
  //   name: 'Sam',
  //   safePassword: 'some-encrypted-password'
  // }
});
```

## Listeners

Listeners are an easy way to subscribe to changes in a collection without executing any code, or creating custom hooks. They're basically read only ways of getting information about what's happening in the DB.

**collection.addListener(eventName, listenerFunction, listenerID)**

The available `eventName`'s to listen to are:

- `beforeSave`: called before every save/update operation.
- `afterSave`: called after every save/update operation.
- `beforeRemove`: called before every remove operation.
- `afterRemove`: called after every remove operation.

The `listenerFunction` will be called with the following `Object`:

```js
{
  data: (Array || Object), // The data that changed
  collection: Array        // The current state of the entire collection
}
```

An example of adding a listener:

```js
collection.addListener('afterSave', data => {
  // do something with `data` like send to analytics or update some other code
}, 'uniqueListenerID');
```

**collection.removeListener(listenerID)**

Unsubscribe from events using the unique listener ID that was used when adding the listener.

```js
collection.removeListener('uniqueListenerID');
```
