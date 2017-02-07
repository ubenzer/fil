import {Project} from "./project";
import fs from "fs-extra";
import Rx from 'rxjs/Rx';
import * as path from "path";
import {fsPromise} from "./utils";

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

    if (cachedContent.isBinary) {
      return await fsPromise.readFileAsync(cachedContent.content);
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
        isBinary: null,

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
    cachedContent.isBinary = newContent instanceof Buffer;
    if (cachedContent.isBinary) {
      const cachePath = this._project.cachePath();
      await fsPromise.ensureDirAsync(cachePath);

      const filePath = path.join(cachePath, id); // TODO sanitize id properly first
      await fsPromise.outputFileAsync(filePath, newContent);

      cachedContent.content = filePath;
    } else {
      cachedContent.content = newContent;
    }

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
    cachedContent.isBinary = null;
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
