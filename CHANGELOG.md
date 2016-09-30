## 1.1.3 (2016-09-30)

Features:

 - Patch version bump.
 - Added reverse sorting.
 - Updated README.

## 1.1.2 (2016-09-20)

Features:

 - Patch version bump.
 - Added tests with Jest — 100% test coverage 🎉.
 - Added linting with ESLint.
 - Updated README.

## 1.1.1 (2016-09-20)

Features:

 - Patch version bump.
 - Fixed the order in which hooks/listeners get called.
 - Changed what data gets emitted to listeners.

## 1.1.0 (2016-09-17)

Features:

 - Minor version bump.
 - Changed the way collections are created. You now create a new instance of the `Collection` class instead of calling `.loadCollection` on a `PocketDB` instance. This means you can extend functionality of the collection like adding your own static methods etc. For more info on using the new `Collection`'s, check out the [README](./README.md#creating-a-collection).
 - Added some hook methods that are called before/after certain PocketDB operations. [See more about hooks](./README.md#hooks).
 - Added read-only listeners that are called before/after certain PocketDB operations. [See more about listeners](./README.md#listeners).
 - Added `.remove()` method for removing many items at once.
 - Updated benchmarking script.
 - Updated README.

## 1.0.3 (2016-09-15)

Features:

 - Patch version bump.
 - Added [Array.filter.() callback function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter#Parameters) to all methods that accept a `{query}` object.
 - Updated benchmarking script.
 - Updated README.

## 1.0.2 (2016-09-15)

Features:

 - Patch version bump.
 - Updated README.

## 1.0.1 (2016-09-15)

Features:

 - Patch version bump.
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

 - Patch version bump.
 - Added `{options}` object to all `.find()` style methods so you can now sort the results you get back.
 - Added `.insertMany()` to insert many items faster.
 - Added `.count()` to count items in a collection without reading from the db file.
 - Added `.removeCollection()` to remove a collection from the db, and it's collection file.
 - Added benchmarking script to test speed of methods. Run `node performance/time.js` with an optional number for the amount of items to perform actions on. Default is `1000`.
 - Updated README.

## 0.0.2 (2016-09-13)

Features:

 - Patch version bump.
 - Updated README.
 - Added CHANGELOG.


## 0.0.1 (2016-09-13)

Initial release.
