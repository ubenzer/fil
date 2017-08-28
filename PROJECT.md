# Fil Project Definition

Fil CLI expects and `index.js` file in the working directory. This file contains **all the definition** that is required to build the static website or host it dynamically. 

As long as it is properly exposed via `index.js` it is up to you to decide your own file stucture for everything.

If you prefer to use Fil progmatically instead of CLI, you don't also need to name this definition file `index.js`. Please refer to [API docs](/API.md) to see how can you programatically use Fil.

**Please note that ALL functions should BE PURE and should NOT MUTATE input parameters** unless explicitly mentioned otherwise.

Pure function is a function that solely depens on input parameters and always produces the same result UNLESS one of the inputs are changed.

async` function means that it is a function that returns a Promise.

## Project Definition File (index.js)

This file contains all the definition required to make fil project working. 

```
module.exports = {
  cachePath: string,
  contentTypes: {id: ContentType},
  contentVersion: async () => string,
  outPath: string,
  routeHandlers: {id: RouteHandlerType},
  watcher: WatcherFn | undefined
}
```
`cachePath` is the path of cache. This path should be readable and writable. The contents of this directory is controlled by fil and this includes removal of everything in this path. Be careful. Cache should not be modified or read directly. Fil manages it.



`contentTypes` contains all the content types registered to this fil project. Each ContentType has an id, used to cross reference across content types as well as internal accounting. 



`contentVersion` is string that returns a different value when content is changed. This could be any kind of string (i.e. sha-256 hash etc.). The only constraint is that **it should return different value when content is changed**. It is **advised** that it should return the same value when content is the same.

This value is used to determine if cache is still valid. If it doesn't return consistent values for same content, your cache might be invalided for nothing and will yield to worse performance.

This function is called once on application start and end and doesn't necessarrlily need to be fast.

This method doesn't need to be **PURE**.

This has no use when cache is disabled.



`outPath` is the path where output is written. This path should be readable and writable. Fil will not clear this path. It'll overwrite files if necessary.

This has no use in dynamic mode as no output is created.



`routeHandlers` contains all route handlers registered to this fil project. Each RouteHandlerType has an id used for internal accounting. **A RouteHandler and ContentHandler should not have the same id**.



`watcherFn` is an optional function that is used to notify Fil when sometihg that affects page output happens. Please refer to latter parts of this documentation to learn technical details of a `watcherFn`.

Fil is capabable to auto reload pages once it detects changes on registered `ContentType` or `RouteHandler` if it is reactive. (if they define all watcher functions of that type, they are considered reactive). However, occasionally there some external triggers which changes page's output thus better to reload to page, such us a change in a resource that is normally feed to web page via frontend AJAX.

This has no use in static mode as there is no page to reload.

## ContentType

Content types can be thought as templates to contents. Each content type defines how to find contents, a way of detecting changes to them, value of the content and their relationships with other contents.

A `ContentType` is an object with the following schema:

```
{
  children: async (EntryInput) => [{id, type}]) | undefined,
  childrenWatcher: WatcherFnWithId | undefined,
  content: async (EntryInput) => {ANY},
  contentWatcher: WactherFnWithId | undefined
}
```
`children` is an optional async function which recieves the type of `EntryInput` as argument and returns an array of objects which contain `id` and  `type` for each entry. 

`EntryInput` type includes id and type fields. **An id and a type field together is used to represent a content in the system.** An id/type pair should be uniqe in the whole application, but diffrent types might have the same id. Content structure should be a tree. Children should NOT belong to more than one parent. 

Returned id/type pairs are the 'children' of the content described in the input arguments. Please see details of `EntryInput` in the latter part of this documentation for more details.

`EntryInput` also contains a field named `project`. This object can be used to interact with other contents defined in system.



This method doesn't need to be **PURE**. Doing a file system I/O, database query, network call or some sort of other data lookup is a natural part of this method. 

As long as a `childrenWatcher` is defined, fil caches chilren and doesn't run this function over an over again. You should prefer defining a`childrenWatcher` instead of writing your own caching mechanisim where possible. 

If optional `children` function is not provided, Fil will think that this all contents of this `ContentType` has no child at all. In other words, not providing `children` equals to `async () => []`.

Order of children are not important.





`  childrenWatcher` is an optional function of type `WatcherFnWithId`. Defining `childrenWatcher` will enable Fil to undestand lifecycle of children and react to it as it happens. Therefore Fil will be able to auto reload pages when change happends. Please see description of `WatcherFnWithId` to learn which arguments it has and what it needs to return for more information.

Wacther should be used ONLY when new children are available or children are removed. **Content or children changes of the children** should not trigger an event. If triggered, cache will be invalidated for nothing.

This has no use in static mode as there is no page to reload.

Fil's cache implementation needs to know when to invalidate itself. If optional `childrenWatcher` is not provided, Fil will not be notified of children changes reactively. Fil will no longer be able do the accounting by invalidating related content chain and caching will be disabled for this content's children calculation. Depending on how much time it takes to calculate children, this may hit the dynamic mode performance.

TODO proofreading

TODO content

TODO contentWacther

TODO EntryInput

TODO WatcherFn

TODO WatcherFnWithId

TODO Routes

## id/type pair

`{id:string|null, type:string}` is an object that consists two string fields, that defines a unique address for a content in the system.

`type` is one of the `ContentType`s registered to system via `contentTypes` in the Project Definition File. Type should be defined in the system or Fil will throw an error.

`id` could be any string, including all sorts of special characters and even emojis. It could be paths, urls or whatsoever. As long as a `ContentType` can understand what this content exacly is via its `id` it could be anything. 

`ContentType` root contents have `id` value of `null`.