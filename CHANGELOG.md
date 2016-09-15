## 1.0.3 (2016-09-15)

Features:

 - Minor version bump.
 - Added [Array.filter.() callback function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter#Parameters) to all methods that accept a `{query}` object.
 - Updated benchmarking script.
 - Updated README.

## 1.0.2 (2016-09-15)

Features:

 - Minor version bump.
 - Updated README.

## 1.0.1 (2016-09-15)

Features:

 - Minor version bump.
 - Updated README.

## 1.0.0 (2016-09-15)

Features:

 - Major version bump.
 - `loadCollection()` is now synchronous. You can assign it to a variable and interact with the collection directly instead of passing the collection name every time.
 - Renamed `.insert() -> .insertOne()`.
 - Renamed `.insertMany() -> .insert()`.
 - Renamed `.update() -> .updateOne()`.
 - Renamed `.remove() -> .removeOne()`.
 - Added `{query}` to `.updateOne()` and `.removeOne()` for more granular updates/removes.
 - Updated benchmarking script to reflect the new API.
 - Renamed `performance/time.js -> benchmark/index.js`.
 - Updated README.

## 0.0.3 (2016-09-14)

Features:

 - Minor version bump.
 - Added `{options}` object to all `.find()` style methods so you can now sort the results you get back.
 - Added `.insertMany()` to insert many items faster.
 - Added `.count()` to count items in a collection without reading from the db file.
 - Added `.removeCollection()` to remove a collection from the db, and it's collection file.
 - Added benchmarking script to test speed of methods. Run `node performance/time.js` with an optional number for the amount of items to perform actions on. Default is `1000`.
 - Updated README.

## 0.0.2 (2016-09-13)

Features:

 - Minor version bump.
 - Updated README.
 - Added CHANGELOG.


## 0.0.1 (2016-09-13)

Initial release.
