'use strict';

const fs = require('fs');
const path = require('path');
const { PocketDB } = require('../index');

const getFilesizeInBytes = (filename) => {
  const stats = fs.statSync(filename)
  const fileSizeInBytes = stats['size'] / 1000000.0;
  return `${fileSizeInBytes} MB`
}

const hasCount = process.argv[2];
const x = hasCount ? parseInt(process.argv[2], 10) : 1000;
const documents = [];
for (let i = 0; i < x; i++) {
    documents.push({
        title: `PocketDB FTW ${i + 1}`,
        published: `today ${i + 1}`,
        rating: `5 stars ${i + 1}`
    });
};

const dbPath = path.resolve(__dirname, 'testdb');

const db = new PocketDB(dbPath);
const collection = db.loadCollection('documents');

console.log(`--- Test for ${x} documents ---`);

// This test is slow because of the for loop.
// If you want to insert a lot of documents, use .insertMany().
//
// console.time('collection.insert() - For Loop');
// for (let i = 0, len = documents.length; i < len; i++) {
//   db.insert(documents[i]);
// }
// console.timeEnd('collection.insert() - For Loop');

console.time('collection.insertMany()');
collection.insertMany(documents);
console.timeEnd('collection.insertMany()');

console.time('collection.find()');
collection.find('documents');
console.timeEnd('collection.find()');

const query = { published: `today ${Math.ceil(x / 2)}`};
console.time(`collection.find(${JSON.stringify(query)})`);
collection.find(query);
console.timeEnd(`collection.find(${JSON.stringify(query)})`);

const options = { sort: 'rating' };
console.time(`collection.find({}, ${JSON.stringify(options)})`);
collection.find({}, options);
console.timeEnd(`collection.find({}, ${JSON.stringify(options)})`);

console.time('collection.findOne()');
collection.findOne('documents');
console.timeEnd('collection.findOne()');

console.time(`collection.findOne(${JSON.stringify(query)})`);
collection.findOne({ published: `today ${Math.ceil(x / 2)}`});
console.timeEnd(`collection.findOne(${JSON.stringify(query)})`);

console.time(`collection.findOne({}, ${JSON.stringify(options)})`);
collection.findOne({}, options);
console.timeEnd(`collection.findOne({}, ${JSON.stringify(options)})`);

console.time('collection.count()');
collection.count('documents');
console.timeEnd('collection.count()');

const id = Math.ceil(x / 2);
const update = Object.assign({}, documents[id - 1], { published: `tomorrow ${Math.ceil(x / 2)}`});
console.time(`collection.update(${JSON.stringify(update)})`);
collection.update(id, update);
console.timeEnd(`collection.update(${JSON.stringify(update)})`);

console.time(`collection.remove(${id})`);
collection.remove(id);
console.timeEnd(`collection.remove(${id})`);

console.time('collection.insert() - Single document');
collection.insert(documents[0]);
console.timeEnd('collection.insert() - Single document');

const collectionPath = `${dbPath}/documents.db`;
console.log(`File size before deletion : ${getFilesizeInBytes(collectionPath)}`);

console.time('db.removeCollection()');
db.removeCollection('documents');
console.timeEnd('db.removeCollection()');

console.log(`--- Test for ${x} documents ---`);
