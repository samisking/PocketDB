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

db.loadCollection('documents').then(() => {
  console.log(`--- Test for ${x} documents ---`);

  // This test is slow because of the for loop.
  // If you want to insert a lot of documents, use .insertMany().
  //
  // console.time('.insert() - For Loop');
  // for (let i = 0, len = documents.length; i < len; i++) {
  //   db.insert('documents', documents[i]);
  // }
  // console.timeEnd('.insert() - For Loop');

  console.time('.insertMany()');
  db.insertMany('documents', documents);
  console.timeEnd('.insertMany()');

  console.time('.find()');
  db.find('documents');
  console.timeEnd('.find()');

  const query = { published: `today ${Math.ceil(x / 2)}`};
  console.time(`.find(${JSON.stringify(query)})`);
  db.find('documents', query);
  console.timeEnd(`.find(${JSON.stringify(query)})`);

  const options = { sort: 'rating' };
  console.time(`.find({}, ${JSON.stringify(options)})`);
  db.find('documents', {}, options);
  console.timeEnd(`.find({}, ${JSON.stringify(options)})`);

  console.time('.findOne()');
  db.findOne('documents');
  console.timeEnd('.findOne()');

  console.time(`.findOne(${JSON.stringify(query)})`);
  db.findOne('documents', { published: `today ${Math.ceil(x / 2)}`});
  console.timeEnd(`.findOne(${JSON.stringify(query)})`);

  console.time(`.findOne({}, ${JSON.stringify(options)})`);
  db.findOne('documents', {}, options);
  console.timeEnd(`.findOne({}, ${JSON.stringify(options)})`);

  console.time('.count()');
  db.count('documents');
  console.timeEnd('.count()');

  const id = Math.ceil(x / 2);
  const update = Object.assign({}, documents[id - 1], { published: `tomorrow ${Math.ceil(x / 2)}`});
  console.time(`.update(${JSON.stringify(update)})`);
  db.update('documents', id, update);
  console.timeEnd(`.update(${JSON.stringify(update)})`);

  console.time(`.remove(${id})`);
  db.remove('documents', id);
  console.timeEnd(`.remove(${id})`);

  const collectionPath = `${dbPath}/documents.db`;
  console.log(`File size before deletion : ${getFilesizeInBytes(collectionPath)}`);

  console.time('.removeCollection()');
  db.removeCollection('documents');
  console.timeEnd('.removeCollection()');

  console.log(`--- Test for ${x} documents ---`);
});
