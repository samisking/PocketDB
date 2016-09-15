'use strict';

const fs = require('fs');
const path = require('path');
const { PocketDB } = require('../lib/pocketdb');

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

const collectionPath = `${dbPath}/documents.db`;
const queryID = Math.ceil(x / 2);
const findQuery = { published: `today ${queryID}`};
const findOptions = { sort: 'rating' };
const updateReq = Object.assign({}, documents[queryID - 1], { published: `tomorrow ${queryID}`});
const removeQuery = { title: `PocketDB FTW ${queryID - 1}`};

// This test is slow because of the for loop.
// If you want to insert a lot of documents, use .insert().
//
// console.time('collection.insertOne() - For Loop');
// for (let i = 0, len = documents.length; i < len; i++) {
//   db.insertOne(documents[i]);
// }
// console.timeEnd('collection.insertOne() - For Loop');

console.time('collection.insert()');
collection.insert(documents);
console.timeEnd('collection.insert()');

console.time('collection.find()');
collection.find();
console.timeEnd('collection.find()');

console.time(`collection.find(${JSON.stringify(findQuery)})`);
collection.find(findQuery);
console.timeEnd(`collection.find(${JSON.stringify(findQuery)})`);

console.time(`collection.find({}, ${JSON.stringify(findOptions)})`);
collection.find({}, findOptions);
console.timeEnd(`collection.find({}, ${JSON.stringify(findOptions)})`);

console.time('collection.findOne()');
collection.findOne();
console.timeEnd('collection.findOne()');

console.time(`collection.findOne(${JSON.stringify(findQuery)})`);
collection.findOne(findQuery);
console.timeEnd(`collection.findOne(${JSON.stringify(findQuery)})`);

console.time(`collection.findOne({}, ${JSON.stringify(findOptions)})`);
collection.findOne({}, findOptions);
console.timeEnd(`collection.findOne({}, ${JSON.stringify(findOptions)})`);

console.time('collection.count()');
collection.count();
console.timeEnd('collection.count()');

console.time(`collection.update(${JSON.stringify(updateReq)})`);
collection.updateOne(queryID, updateReq);
console.timeEnd(`collection.update(${JSON.stringify(updateReq)})`);

console.time(`collection.removeOne(${JSON.stringify(removeQuery)})`);
collection.removeOne(removeQuery);
console.timeEnd(`collection.removeOne(${JSON.stringify(removeQuery)})`);

console.time('collection.insertOne()');
collection.insertOne(documents[0]);
console.timeEnd('collection.insertOne()');

console.log(`File size before deletion : ${getFilesizeInBytes(collectionPath)}`);

console.time('db.removeCollection()');
db.removeCollection('documents');
console.timeEnd('db.removeCollection()');

console.log(`--- Test for ${x} documents ---`);
