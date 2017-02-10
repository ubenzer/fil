import {Project} from "./project";
import Rx from 'rxjs/Rx';
import * as dotProp from 'dot-prop';
import {fsPromise, pathForCacheItem} from "./utils";

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

    const cachedContent = this._cache.contents[id];

    if (cachedContent instanceof Object) {
      const binaryFields = cachedContent.content[ContentManager.binaryFieldDesriptorKey];
      const binaryPaths = binaryFields.map(bf => {
        const cachePath = this._project.cachePath();
        return pathForCacheItem({cachePath, id, itemKey: bf});
      });

      const binaryDataArr = await Promise.all(binaryPaths.map(bp => fsPromise.readFileAsync(bp)));

      binaryDataArr.forEach((bd, idx) => {
        dotProp.set(cachedContent.content, binaryFields[idx], bd);
      });
    }

    return cachedContent.content;
  }

  watcher$() {
    return this._allContentsChangeObservable;
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

    const cachedContent = this._cache.contents[id];

    // check arguments first to see if we already have a calculated value
    const contentArguments = cachedContent.fn.contentArguments || ContentManager.defaultContentArguments;
    const newArgs = await contentArguments({project: this._project, id});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs: cachedContent.contentArgs});

    if (cachedContent.contentArgs !== null && areArgsSame) {
      return;
    }
    //console.log(`Content Cache miss for: ${id}`);

    const newContent = await cachedContent.fn.content(newArgs);
    cachedContent.contentArgs = newArgs;

    if (cachedContent instanceof Object) {
      const binaryFields = cachedContent.fn.binaryContentKeys || [];
      const binaryData = binaryFields
        .map(bf => ({fieldName: bf, fieldValue: dotProp.get(newContent, bf)}))
        .filter(bdo => !!bdo.fieldValue);

      binaryData.map(({fieldName}) => dotProp.delete(newContent, fieldName));
      newContent[ContentManager.binaryFieldDesriptorKey] = binaryData.map(bdo => bdo.fieldName);

      await Promise.all(binaryData.map(({fieldName, fieldValue}) => {
        const cachePath = this._project.cachePath();
        const filePath = pathForCacheItem({cachePath, id, itemKey: fieldName});
        return fsPromise.outputFileAsync(filePath, fieldValue);
      }));
    }

    cachedContent.content = newContent;

    if (!cachedContent.contentSubscription && cachedContent.fn.contentWatcher$) {
      cachedContent.contentSubscription = cachedContent.fn.contentWatcher$(newArgs)
        .subscribe(this._contentSubscriptionFnFor.bind(this, {id}));
    }
  }

  _contentSubscriptionFnFor({id}) {
    console.log(`Content changed for: ${id}`);
    this._ensureCacheEntryFor({id});

    const cachedContent = this._cache.contents[id];

    cachedContent.contentArgs = null;
    cachedContent.content = null;
    if (cachedContent.contentSubscription) {
      cachedContent.contentSubscription.unsubscribe();
      cachedContent.contentSubscription = null;
    }

    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next();
  }

  _childrenSubscriptionFnFor({id}) {
    console.log(`Children changed for: ${id}`);
    this._ensureCacheEntryFor({id});

    const cachedContent = this._cache.contents[id];

    if (cachedContent.children) {
      cachedContent.children.forEach((c) => {
        this._deleteCacheEntryFor({id: c});
      });
    }
    cachedContent.childrenArgs = null;
    cachedContent.children = null;
    if (cachedContent.childrenSubscription) {
      cachedContent.childrenSubscription.unsubscribe();
      cachedContent.childrenSubscription = null;
    }

    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next();
  }

  _deleteCacheEntryFor({id}) {
    const cachedContent = this._cache.contents[id];
    if (!cachedContent) { return; }
    if (cachedContent.childrenSubscription) {
      cachedContent.childrenSubscription.unsubscribe();
    }
    if (cachedContent.contentSubscription) {
      cachedContent.contentSubscription.unsubscribe();
    }
    if (cachedContent.children) {
      cachedContent.children.forEach(c => this._deleteCacheEntryFor(c));
    }
    delete this._cache.contents[id];
  }

  async _ensureCachedChildrenFor({id}) {
    this._ensureCacheEntryFor({id});

    const cachedContent = this._cache.contents[id];

    // check arguments first to see if we already have a calculated value
    const childrenArguments = cachedContent.fn.childrenArguments || ContentManager.defaultChildrenArguments;
    const newArgs = await childrenArguments({project: this._project, id});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs: cachedContent.childrenArgs});

    if (cachedContent.childrenArgs !== null && areArgsSame) {
      return;
    }
    //console.log(`Child Cache miss for: ${id}`);

    const childrenCalculatorFn = cachedContent.fn.children || ContentManager.defaultChildrenCalculator;
    const newChildren = await childrenCalculatorFn(newArgs);
    cachedContent.childrenArgs = newArgs;
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
