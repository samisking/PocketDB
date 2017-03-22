import fs from 'fs';
import path from 'path';
import { PocketDB, Collection } from '../src';

// A mock db that gets removed after every test
const dbPath = path.resolve(__dirname, 'test-db');
const db = new PocketDB(dbPath);
const collectionName = 'test-db';

// A mock db that doesn't get removed after each test
const persistentTestDB = new PocketDB(path.resolve(__dirname, 'persistentTestDB'));
const persistentCollectionName = 'persistent';

let collection;
let testCollectionName;
let testIndex = 0;

// Reset the module cache and create a new collection to be used for the test
beforeEach(() => {
  jest.resetModules();

  testIndex += 1;
  testCollectionName = `${collectionName}-${testIndex}`;
  collection = new Collection(db, testCollectionName);
});

// Remove the collection after each test
afterEach(() => {
  if (db.db[testCollectionName]) {
    db.removeCollection(testCollectionName);
  }
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
describe('the db', () => {
  it('should initialise the db correctly', () => {
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
    // Load a new collection
    expect(collection.name).toEqual(testCollectionName);
    expect(collection.path).toBe(`${dbPath}/${testCollectionName}.db`);
    expect(db.db[testCollectionName]).toBeDefined();
    expect(Object.keys(db.db).length).toBe(1);

    // Test loading of an existing collection
    expect(() => {
      new Collection(db, testCollectionName);
    }).toThrow();

    expect(Object.keys(db.db).length).toBe(1);

    // Try and call load collection directly with a non-collection
    expect(() => {
      db.loadCollection('this-is-not-a-collection');
    }).toThrowError(TypeError);
  });

  it('should remove collections properly', () => {
    expect(db.db[testCollectionName]).toBeDefined();
    db.removeCollection(testCollectionName);
    expect(db.db[testCollectionName]).toBeUndefined();
  });
});
