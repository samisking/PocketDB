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
const IDs = [queryID - 1, queryID, queryID + 1];
const findFunction = i => IDs.includes(i.id);
const findOptions = { sort: 'rating' };
const updateReq = Object.assign({}, documents[queryID - 1], { published: `tomorrow ${queryID}`});
const updateFunction = i => i.published === `today ${queryID}`;
const removeQuery = { title: `PocketDB FTW ${queryID - 1}`};
const removeFunction = i => i.id === queryID - 2;

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

console.time('collection.find(fn)');
collection.find(findFunction);
console.timeEnd('collection.find(fn)');

console.time(`collection.find({query})`);
collection.find(findQuery);
console.timeEnd(`collection.find({query})`);

console.time(`collection.find({}, {sort})`);
collection.find({}, findOptions);
console.timeEnd(`collection.find({}, {sort})`);

console.time('collection.findOne()');
collection.findOne();
console.timeEnd('collection.findOne()');

console.time('collection.findOne(fn)');
collection.findOne(findFunction);
console.timeEnd('collection.findOne(fn)');

console.time(`collection.findOne({query})`);
collection.findOne(findQuery);
console.timeEnd(`collection.findOne({query})`);

console.time(`collection.findOne({}, {sort})`);
collection.findOne({}, findOptions);
console.timeEnd(`collection.findOne({}, {sort})`);

console.time('collection.count()');
collection.count();
console.timeEnd('collection.count()');

console.time(`collection.updateOne(fn, {udpate})`);
collection.updateOne(updateFunction, updateReq);
console.timeEnd(`collection.updateOne(fn, {udpate})`);

console.time(`collection.updateOne({query}, {update})`);
collection.updateOne({ id: queryID }, updateReq);
console.timeEnd(`collection.updateOne({query}, {update})`);

console.time(`collection.removeOne(fn)`);
collection.removeOne(i => i.id === 1);
console.timeEnd(`collection.removeOne(fn)`);

console.time(`collection.removeOne({query})`);
collection.removeOne(removeQuery);
console.timeEnd(`collection.removeOne({query})`);

console.time('collection.insertOne()');
collection.insertOne(documents[0]);
console.timeEnd('collection.insertOne()');

console.log(`File size before deletion : ${getFilesizeInBytes(collectionPath)}`);

console.time('db.removeCollection()');
db.removeCollection('documents');
console.timeEnd('db.removeCollection()');

console.log(`--- Test for ${x} documents ---`);
