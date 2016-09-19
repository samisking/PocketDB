const fs = require('fs');
const path = require('path');
const { PocketDB, Collection } = require('../lib');

const dbPath = path.resolve(__dirname, 'testdb');
const collectionName = 'collection';

// beforeEach(() => {
//   jest.resetModules();
// });

describe('the db', () => {
  const db = new PocketDB(dbPath);
  const collection = new Collection(db, collectionName);

  it('should load collections properly', () => {
    expect(collection.name).toBe(collectionName);
    expect(collection._collection.path).toBe(`${dbPath}/${collectionName}.db`);
  });

  it('should remove collections properly', () => {
    expect(db.db[collectionName]).toBeDefined();
    db.removeCollection(collectionName);
    expect(db.db[collectionName]).toBeUndefined();
  });
});

describe('a collection', () => {
  const db = new PocketDB(dbPath);

  it('should throw when connecting to an invalid PocketDB instance', () => {
    expect(() => {
      new Collection('not-a-db', 'fake-collection')
    }).toThrowError(TypeError);
  });

  const collection = new Collection(db, collectionName);

  // it('should insert')
});

// afterEach(() => {
//   fs.unlinkSync(`${dbPath}/${collectionName}.db`);
// });
