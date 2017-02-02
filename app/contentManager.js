import {Project} from "./project";
import fs from "fs-extra";
import Rx from 'rxjs/Rx';
import * as path from "path";

export class ContentManager {
  constructor({project}) {
    this._project = project;
    this._cache = {
      contents: {}
    };
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
      const readFile = Rx.Observable.bindNodeCallback(fs.readFile);
      return await readFile(cachedContent.content).toPromise();
    }
    return cachedContent.content;
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
    const newArgs = await cachedContent.fn.contentArguments({project: this._project, id});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs: cachedContent.contentArgs});

    if (cachedContent.contentArgs !== null && areArgsSame) {
      return;
    }
    console.log(`Content Cache miss for: ${id}`);

    const newContent = await cachedContent.fn.content(newArgs);
    cachedContent.contentArgs = newArgs;
    cachedContent.isBinary = newContent instanceof Buffer;
    if (cachedContent.isBinary) {
      const ensureDir = Rx.Observable.bindNodeCallback(fs.ensureDir);
      const cachePath = this._project.cachePath();
      await ensureDir(cachePath).toPromise();

      const writeFile = Rx.Observable.bindNodeCallback(fs.writeFile);
      const filePath = path.join.apply(cachePath, id); // TODO sanitize id properly first
      await writeFile(filePath, newContent).toPromise();

      cachedContent.content = filePath;
    } else {
      cachedContent.content = newContent;
    }

    if (!cachedContent.contentSubscription) {
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
    const newArgs = await cachedContent.fn.childrenArguments({project: this._project, id});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs: cachedContent.childrenArgs});

    if (cachedContent.childrenArgs !== null && areArgsSame) {
      return;
    }
    console.log(`Child Cache miss for: ${id}`);

    const newChildren = await cachedContent.fn.children(newArgs);
    cachedContent.childrenArgs = newArgs;
    cachedContent.children = newChildren;

    if (!cachedContent.childrenSubscription) {
      cachedContent.childrenSubscription  = cachedContent.fn.childrenWatcher$(newArgs)
        .subscribe(this._childrenSubscriptionFnFor.bind(this, {id}));
    }
  }
}
