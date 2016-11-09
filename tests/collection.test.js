const fs = require('fs');
const path = require('path');
const { PocketDB, Collection } = require('../lib');

// A mock db that gets removed after every test
const dbPath = path.resolve(__dirname, 'test-collection');
const db = new PocketDB(dbPath);
const collectionName = 'test-collection';

// Some mock items to insert
const insertItems = [
  {
    name: 'Amie',
    age: 22,
    profession: 'Developer'
  },
  {
    name: 'John',
    age: 21,
    profession: 'Designer'
  },
  {
    name: 'Lisa',
    age: 19,
    profession: 'Developer'
  },
  {
    name: 'Doug',
    age: 21,
    profession: 'Developer'
  }
];

let collection;
let testIndex = 0;

// Reset the module cache and create a new collection to be used for the test
beforeEach(() => {
  jest.resetModules();

  testIndex++;
  collection = new Collection(db, `${collectionName}-${testIndex}`);
});

// Remove the collection after each test
afterEach(() => {
  db.removeCollection(`${collectionName}-${testIndex}`);
});

// Clean up all the test databases when we're done
afterAll(() => {
  if (fs.existsSync(dbPath)) {
    fs.readdirSync(dbPath).forEach((file) => {
      fs.unlinkSync(path.resolve(dbPath, file));
    });

    fs.rmdirSync(dbPath);
  }
});

// The actual tests
describe('the collection', () => {
  it('should throw when connecting to an invalid PocketDB instance', () => {
    expect(() => {
      new Collection('not-a-db', 'fake-collection');
    }).toThrowError(TypeError);
  });

  it('should find and sort all items', () =>
    collection.insert(insertItems)
      .then(() => collection.find({}, { sort: 'age' }))
      .then(res => {
        expect(res.length).toEqual(4);
        expect(res[0].name).toEqual('Lisa');
        expect(res[1].name).toEqual('John');
        expect(res[2].name).toEqual('Doug');
        expect(res[3].name).toEqual('Amie');
      })
  );

  it('should find and sort all items in reverse', () =>
    collection.insert(insertItems)
      .then(() => collection.find({}, { sort: '-age' }))
      .then(res => {
        expect(res.length).toEqual(4);
        expect(res[0].name).toEqual('Amie');
        expect(res[1].name).toEqual('John');
        expect(res[2].name).toEqual('Doug');
        expect(res[3].name).toEqual('Lisa');
      })
  );

  it('should find using a filter function', () =>
    collection.insert(insertItems)
      .then(() => collection.find(i => i.age < 21))
      .then(res => {
        expect(res.length).toEqual(1);
        expect(res[0].name).toEqual('Lisa');
      })
  );

  it('should find using a query object', () =>
    collection.insert(insertItems)
      .then(() => collection.find({ name: 'Amie' }))
      .then(res => {
        expect(res.length).toEqual(1);
        expect(res[0].name).toEqual('Amie');
      })
  );

  it('should find one item using a filter function', () =>
    collection.insert(insertItems)
      .then(() => collection.findOne(i => i.profession === 'Developer'))
      .then(res => {
        expect(res.name).toEqual('Amie');
      })
  );

  it('should find one item using a query object', () =>
    collection.insert(insertItems)
      .then(() => collection.findOne({ profession: 'Developer' }, { sort: 'age' }))
      .then(res => {
        expect(res.name).toEqual('Lisa');
      })
  );

  it('should insert many items', () =>
    collection.insert(insertItems)
      .then((inserted) => {
        expect(inserted.length).toEqual(insertItems.length);
        expect(inserted[3].id).toEqual(4);
        return collection.find();
      }).then(allItems => {
        expect(allItems.length).toEqual(4);
      })
  );

  it('should not insert many items if not passed an array', () =>
    collection.insert({ name: 'Sam' })
      .catch(err => {
        expect(err.toString()).toEqual('Error: You must pass a valid array to `.insert()`.');
      })
  );

  it('should insert one item', () =>
    collection.insertOne({ name: 'Sally', age: 21, profession: 'Designer' })
      .then(inserted => {
        expect(inserted.id).toEqual(1);
        return collection.find();
      })
      .then(allItems => {
        expect(allItems.length).toEqual(1);
      })
  );

  it('should update one item using a filter function', () =>
    collection.insert(insertItems)
      .then(() => collection.updateOne(i => i.id === 1, { name: 'Sam' }))
      .then(updated => {
        expect(updated.id).toEqual(1);
        expect(updated.name).toEqual('Sam');
      })
  );

  it('should update one item using a query object', () =>
    collection.insert(insertItems)
      .then(() => collection.updateOne({ name: 'Amie' }, { name: 'Sam' }))
      .then(res => {
        expect(res.id).toEqual(1);
        expect(res.name).toEqual('Sam');
      })
  );

  it('should error when updating without a query', () =>
    collection.insert(insertItems)
      .then(() => collection.updateOne())
      .catch(err => {
        expect(err.toString()).toEqual('Error: You must specify a query to update an item.');
      })
  );

  it('should error when no items were found to update', () =>
    collection.insert(insertItems)
      .then(() => collection.updateOne(i => i.d === 100, { name: 'Sam' }))
      .catch(err => {
        expect(err.toString()).toEqual('Error: Didn\'t find any items to update.');
      })
  );

  it('should remove items', () =>
    collection.insert(insertItems)
      .then(() => collection.find())
      .then(found => {
        expect(found.length).toEqual(4);
        return collection.removeOne(i => i.id === 1);
      })
      .then(removed => {
        expect(removed.id).toEqual(1);
        return collection.find();
      })
      .then(found => {
        expect(found.length).toEqual(3);
      })
  );

  it('should error when trying to remove without a query', () =>
    collection.insert(insertItems)
      .then(() => collection.removeOne())
      .catch(err => {
        expect(err.toString()).toEqual('Error: You must specify a query to remove an item.');
      })
  );

  it('should error when no items were found to remove', () =>
    collection.insert(insertItems)
      .then(() => collection.removeOne(i => i.id === 100))
      .catch(err => {
        expect(err.toString()).toEqual('Error: Didn\'t find any items to remove.');
      })
  );

  it('should remove multiple items', () => {
    const extraItems = [{ name: 'Nora', age: 40 }, { name: 'Doug', age: 22 }];

    return collection.insert(insertItems.concat(extraItems))
      .then(() => collection.remove(i => i.age > 21))
      .then(res => {
        expect(res.length).toEqual(3);
        return collection.find();
      })
      .then(res => {
        expect(res.length).toEqual(3);
      });
  });

  it('should error when removing non-existing items', () =>
    collection.insert(insertItems)
      .then(() => collection.remove(i => i.d > 100))
      .catch(err => {
        expect(err.toString()).toEqual('Error: Didn\'t find any items to remove.');
      })
  );

  it('should remove all items', () =>
    collection.insert(insertItems)
      .then(() => collection.remove())
      .then(removed => {
        expect(removed.length).toEqual(4);
        return collection.find();
      })
      .then(res => {
        expect(res.length).toEqual(0);
      })
  );

  it('should count all items', () =>
    collection.insert(insertItems)
      .then(() => collection.count())
      .then(count => {
        expect(count).toEqual(4);
      })
  );

  it('should count all items with a query', () =>
    collection.insert(insertItems)
      .then(() => collection.count(i => i.age < 20))
      .then(res => {
        expect(res).toEqual(1);
      })
  );

  it('should add listeners', () => {
    const mockFn = jest.fn();

    collection.addListener('beforeSave', mockFn, 'beforeSaveTest');

    expect(collection.listeners.length).toEqual(1);
    expect(collection.listeners[0].id).toEqual('beforeSaveTest');

    // Test an invalid event name
    expect(() => {
      collection.addListener('not-a-valid-event-name');
    }).toThrow();

    // Test adding an existing listener
    expect(() => {
      collection.addListener('beforeSave', mockFn, 'beforeSaveTest');
    }).toThrow();

    return collection.insertOne({ name: 'Sam', age: 24 })
      .then(() => {
        expect(mockFn).toBeCalledWith({
          original: {
            name: 'Sam',
            age: 24
          },
          modified: {
            name: 'Sam',
            age: 24,
            id: 1
          }
        });
      });
  });

  it('should remove listeners', () => {
    const mockFn = jest.fn();

    collection.addListener('afterSave', mockFn, 'afterSaveTest');

    expect(collection.listeners.length).toEqual(1);
    expect(collection.listeners[0].id).toEqual('afterSaveTest');

    collection.removeListener('afterSaveTest');

    expect(collection.listeners.length).toEqual(0);
  });
});
