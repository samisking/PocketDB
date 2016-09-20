const fs = require('fs');
const path = require('path');
const { PocketDB, Collection } = require('../lib');

// A mock db that gets removed after every test
const dbPath = path.resolve(__dirname, 'db');
const db = new PocketDB(dbPath);
const collectionName = 'db-test';

// A mock db that doesn't get removed after each test
const persistentTestDB = new PocketDB(path.resolve(__dirname, 'persistentTestDB'));
const persistentCollectionName = 'persistent';

// Reset the module cache after each test
beforeEach(() => {
  jest.resetModules();
});

// The actual tests
describe('the db', () => {
  it('should initialise the db correctly', () => {
    const collection = new Collection(db, collectionName);
    expect(collection.name).toEqual(collectionName);

    // Expect the new db to be created
    expect(db.dbPath).toEqual(dbPath);
    expect(fs.existsSync(dbPath)).toBeTruthy();

    // Make a new DB at the same path
    const brandNew = new PocketDB(dbPath);
    expect(brandNew.dbPath).toEqual(dbPath);

    // Test loading a collection from disk
    const collectionFromDisk = new Collection(persistentTestDB, persistentCollectionName);
    expect(collectionFromDisk._collection.nextID).toEqual(3);
  });

  it('should load collections properly', () => {
    const collection = new Collection(db, collectionName);

    // Load a new collection
    expect(collection.name).toBe(collectionName);
    expect(collection._collection.path).toBe(`${dbPath}/${collectionName}.db`);
    expect(db.db[collectionName]).toBeDefined();
    expect(Object.keys(db.db).length).toBe(1);

    // Test loading of an existing collection
    expect(() => {
      new Collection(db, collectionName);
    }).toThrow();

    expect(Object.keys(db.db).length).toBe(1);

    // Try and call load collection directly with a non-collection
    expect(() => {
      db.loadCollection('this-is-not-a-collection');
    }).toThrowError(TypeError);
  });

  it('should remove collections properly', () => {
    const collection = new Collection(db, collectionName);
    expect(collection.name).toEqual(collectionName);

    expect(db.db[collectionName]).toBeDefined();
    db.removeCollection(collectionName).then(() => {});
    expect(db.db[collectionName]).toBeUndefined();
  });
});

// Remove the non-persistent collection after each test,
// along with the non-persistent db folder
afterEach(() => {
  db.removeCollection(collectionName).then(() => {});

  if (fs.existsSync(dbPath)) {
    fs.rmdirSync(dbPath);
  }
});
