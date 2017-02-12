import {Project} from "./project";
import Rx from 'rxjs/Rx';
import {fsPromise, translateError} from "./utils/misc";
import * as path from "path";
import {binaryItemsFromDisk, binaryItemsToDisk, clearBinaryItemsFromDisk} from "./utils/binaryCacheHelpers";

export class ContentManager {
  constructor({project}) {
    this._project = project;
    this._cache = {
      contents: {}
    };
    this._allContentsChangeSubscriber = null;
    this._allContentsChangeObservable = Rx.Observable.create((subscriber) => {
      this._allContentsChangeSubscriber = subscriber;
    });
  }

  contentTypes() {
    return Object.keys(this._project._project.contentTypes());
  }

  async metaOf({id}) {
    await this._ensureCachedChildrenFor({id});

    const cachedContent = this._cache.contents[id];

    return {
      id: id,
      type: id.split("@")[0],
      hasChild: cachedContent.children.length > 0,
      children: cachedContent.children
    }
  }

  async valueOf({id}) {
    await this._ensureCachedContentFor({id});
    const cachedContent = this._cache.contents[id].content;
    const cachePath = this._project.cachePath();
    const accountingKey = ContentManager.binaryFieldDesriptorKey;
    return binaryItemsFromDisk({
      id,
      type: ContentManager.binaryCacheTypes.content,
      json: cachedContent,
      cachePath,
      accountingKey
    });
  }

  watcher$() {
    return this._allContentsChangeObservable;
  }

  async persistCache() {
    const cacheContentsWithoutFns =
      Object.keys(this._cache.contents)
        .map(id => {
          const cacheItemCopy = {...this._cache.contents[id]};
          cacheItemCopy.fn = null;
          cacheItemCopy.contentSubscription = null;
          cacheItemCopy.childrenSubscription = null;
          return {id, cacheItemCopy};
        })
        .reduce((acc, {id, cacheItemCopy}) =>
          ({[id]: cacheItemCopy, ...acc})
        , {});
    const cache = {contents: cacheContentsWithoutFns};
    const filePath = path.join(this._project.cachePath(), "contents.json");
    return fsPromise.outputJsonAsync(filePath, cache);
  }

  async loadCache() {
    const filePath = path.join(this._project.cachePath(), "contents.json");
    const json = await fsPromise.readJsonAsync(filePath).catch(translateError);
    if (json instanceof Error) {
      // means we have no cache at all.
      return;
    }

    await Promise.all(Object.keys(this._cache.contents)
      .map(id => this._deleteCacheEntryFor({id})));

    this._cache = json;
  }

  /* Private operations */
  _ensureCacheEntryFor({id}) {
    if (!this._cache.contents[id]) {
      this._cache.contents[id] = {
        content: null,
        contentSubscription: null,
        contentArgs: null,

        children: null,
        childrenSubscription: null,
        childrenArgs: null,

        fn: null
      };
    }
    const cachedContent = this._cache.contents[id];
    if (!cachedContent.fn) {
      const handlers = this._project._project.contentTypes();
      cachedContent.fn = handlers[id.split("@")[0]];
    }
  }

  async _ensureCachedContentFor({id}) {
    this._ensureCacheEntryFor({id});

    const accountingKey = ContentManager.binaryFieldDesriptorKey;
    const cachePath = this._project.cachePath();

    const cachedContent = this._cache.contents[id];

    // check arguments first to see if we already have a calculated value
    const contentArgumentsFn = cachedContent.fn.contentArguments || ContentManager.defaultContentArguments;

    const oldArgs = await binaryItemsFromDisk({
      id,
      type: ContentManager.binaryCacheTypes.contentArgs,
      json: cachedContent.contentArgs,
      cachePath,
      accountingKey
    });
    const newArgs = await contentArgumentsFn({project: this._project, id});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs});

    if (cachedContent.content !== null && areArgsSame) {
      return;
    }
    console.log(`Content Cache miss for: ${id}`);

    let newContent = await cachedContent.fn.content(newArgs);
    cachedContent.contentArgs = await binaryItemsToDisk({
      id,
      type: ContentManager.binaryCacheTypes.contentArgs,
      json: newArgs,
      cachePath,
      accountingKey
    });
    cachedContent.content = await binaryItemsToDisk({
      id,
      type: ContentManager.binaryCacheTypes.content,
      json: newContent,
      cachePath,
      accountingKey
    });

    if (!cachedContent.contentSubscription && cachedContent.fn.contentWatcher$) {
      cachedContent.contentSubscription = cachedContent.fn.contentWatcher$(newArgs)
        .subscribe(this._contentSubscriptionFnFor.bind(this, {id}));
    }
  }

  async _contentSubscriptionFnFor({id}) {
    console.log(`Content changed for: ${id}`);
    this._ensureCacheEntryFor({id});

    const cachedContent = this._cache.contents[id];

    const cachePath = this._project.cachePath();
    const accountingKey = ContentManager.binaryFieldDesriptorKey;
    await clearBinaryItemsFromDisk({
      id,
      type: ContentManager.binaryCacheTypes.content,
      json: cachedContent.content,
      cachePath,
      accountingKey
    });
    await clearBinaryItemsFromDisk({
      id,
      type: ContentManager.binaryCacheTypes.contentArgs,
      json: cachedContent.contentArgs,
      cachePath,
      accountingKey
    });

    cachedContent.contentArgs = null;
    cachedContent.content = null;
    if (cachedContent.contentSubscription) {
      cachedContent.contentSubscription.unsubscribe();
      cachedContent.contentSubscription = null;
    }

    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next();
  }

  async _childrenSubscriptionFnFor({id}) {
    console.log(`Children changed for: ${id}`);
    this._ensureCacheEntryFor({id});

    const cachedContent = this._cache.contents[id];

    if (cachedContent.children) {
      await Promise.all(cachedContent.children.map((c) => {
        this._deleteCacheEntryFor({id: c});
      }));
    }

    const cachePath = this._project.cachePath();
    const accountingKey = ContentManager.binaryFieldDesriptorKey;
    await clearBinaryItemsFromDisk({
      id,
      type: ContentManager.binaryCacheTypes.childrenArgs,
      json: cachedContent.childrenArgs,
      cachePath,
      accountingKey
    });

    cachedContent.childrenArgs = null;
    cachedContent.children = null;
    if (cachedContent.childrenSubscription) {
      cachedContent.childrenSubscription.unsubscribe();
      cachedContent.childrenSubscription = null;
    }

    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next();
  }

  async _deleteCacheEntryFor({id}) {
    const cachedContent = this._cache.contents[id];
    if (!cachedContent) { return; }
    if (cachedContent.childrenSubscription) {
      cachedContent.childrenSubscription.unsubscribe();
    }
    if (cachedContent.contentSubscription) {
      cachedContent.contentSubscription.unsubscribe();
    }
    if (cachedContent.children) {
      await Promise.all(cachedContent.children.map(c => this._deleteCacheEntryFor(c)));
    }

    const cachePath = this._project.cachePath();
    const accountingKey = ContentManager.binaryFieldDesriptorKey;
    await Promise.all([
      clearBinaryItemsFromDisk({
        id,
        type: ContentManager.binaryCacheTypes.content,
        json: cachedContent.content,
        cachePath,
        accountingKey
      }),
      clearBinaryItemsFromDisk({
        id,
        type: ContentManager.binaryCacheTypes.contentArgs,
        json: cachedContent.contentArgs,
        cachePath,
        accountingKey
      }),
      clearBinaryItemsFromDisk({
        id,
        type: ContentManager.binaryCacheTypes.childrenArgs,
        json: cachedContent.childrenArgs,
        cachePath,
        accountingKey
      })
    ]);

    delete this._cache.contents[id];
  }

  async _ensureCachedChildrenFor({id}) {
    this._ensureCacheEntryFor({id});

    const accountingKey = ContentManager.binaryFieldDesriptorKey;
    const cachePath = this._project.cachePath();

    const cachedContent = this._cache.contents[id];

    // check arguments first to see if we already have a calculated value
    const childrenArguments = cachedContent.fn.childrenArguments || ContentManager.defaultChildrenArguments;

    const oldArgs = await binaryItemsFromDisk({
      id,
      type: ContentManager.binaryCacheTypes.childrenArgs,
      json: cachedContent.childrenArgs,
      cachePath,
      accountingKey
    });
    const newArgs = await childrenArguments({project: this._project, id});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs});

    if (cachedContent.children !== null && areArgsSame) {
      return;
    }
    //console.log(`Child Cache miss for: ${id}`);

    const childrenCalculatorFn = cachedContent.fn.children || ContentManager.defaultChildrenCalculator;
    const newChildren = await childrenCalculatorFn(newArgs);
    cachedContent.childrenArgs = await binaryItemsToDisk({
      id,
      type: ContentManager.binaryCacheTypes.childrenArgs,
      json: newArgs,
      cachePath,
      accountingKey
    });
    cachedContent.children = newChildren;

    if (!cachedContent.childrenSubscription && cachedContent.fn.childrenWatcher$) {
      cachedContent.childrenSubscription = cachedContent.fn.childrenWatcher$(newArgs)
        .subscribe(this._childrenSubscriptionFnFor.bind(this, {id}));
    }
  }
}
ContentManager.defaultChildrenCalculator = async () => ({});
ContentManager.defaultChildrenArguments = async ({id}) => ({id});
ContentManager.defaultContentArguments = async ({id}) => ({id});
ContentManager.binaryFieldDesriptorKey = "_binaryFields";
ContentManager.binaryCacheTypes = {
  content: "content",
  contentArgs: "contentArgs",
  childrenArgs: "childrenArgs"
};
