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

  async contentTypes() {
    const id = ContentManager._toStringId([]);
    this._ensureCacheEntryFor({id});
    return Object.keys(this._cache.contents);
  }

  async metaOf({contentId}) {
    const stringId = ContentManager._toStringId({contentId});
    await this._ensureCachedChildrenFor({contentId});

    const cachedContent = this._cache.contents[stringId];

    return {
      contentId: contentId,
      type: contentId[0],
      hasChild: cachedContent.children.length > 0,
      children: cachedContent.children
    }
  }

  async valueOf({contentId}) {
    const stringId = ContentManager._toStringId({contentId});

    await this._ensureCachedContentFor({contentId});

    const cachedContent = this._cache.contents[stringId];

    if (cachedContent.isBinary) {
      const readFile = Rx.Observable.bindNodeCallback(fs.readFile);
      return await readFile(cachedContent.content).toPromise();
    }
    return cachedContent.content;
  }

  /* Private operations */
  _ensureCacheEntryFor({contentId}) {
    const stringId = ContentManager._toStringId({contentId});

    if (!this._cache.contents[stringId]) {
      this._cache.contents[stringId] = {
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
    const cachedContent = this._cache.contents[stringId];
    if (!cachedContent.fn) {
      const handlers = this._project._project.contentTypes();
      cachedContent.fn = handlers[contentId[0]];
    }
  }

  async _ensureCachedContentFor({contentId}) {
    const stringId = ContentManager._toStringId({contentId});
    this._ensureCacheEntryFor({contentId});

    const cachedContent = this._cache.contents[stringId];

    // check arguments first to see if we already have a calculated value
    const newArgs = await cachedContent.fn.contentArguments({project: this._project, contentId});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs: cachedContent.contentArgs});

    if (cachedContent.contentArgs !== null && areArgsSame) {
      return;
    }
    console.log(`Content Cache miss for: ${stringId}`);

    const newContent = await cachedContent.fn.content(newArgs);
    cachedContent.contentArgs = newArgs;
    cachedContent.isBinary = newContent instanceof Buffer;
    if (cachedContent.isBinary) {
      const ensureDir = Rx.Observable.bindNodeCallback(fs.ensureDir);
      const cachePath = this._project.cachePath();
      await ensureDir(cachePath).toPromise();

      const writeFile = Rx.Observable.bindNodeCallback(fs.writeFile);
      const filePath = path.join.apply(this, [cachePath, ...contentId]);
      await writeFile(filePath, newContent).toPromise();

      cachedContent.content = filePath;
    } else {
      cachedContent.content = newContent;
    }

    if (!cachedContent.contentSubscription) {
      cachedContent.contentSubscription = cachedContent.fn.contentWatcher$(newArgs)
        .subscribe(this._contentSubscriptionFnFor.bind(this, {contentId}));
    }
  }

  _contentSubscriptionFnFor({contentId}) {
    const stringId = ContentManager._toStringId({contentId});
    console.log(`Content changed for: ${stringId}`);
    this._ensureCacheEntryFor({contentId});

    const cachedContent = this._cache.contents[stringId];

    cachedContent.contentArgs = null;
    cachedContent.content = null;
    cachedContent.isBinary = null;
    if (cachedContent.contentSubscription) {
      cachedContent.contentSubscription.unsubscribe();
      cachedContent.contentSubscription = null;
    }
  }

  _childrenSubscriptionFnFor({contentId}) {
    const stringId = ContentManager._toStringId({contentId});
    console.log(`Children changed for: ${stringId}`);
    this._ensureCacheEntryFor({contentId});

    const cachedContent = this._cache.contents[stringId];

    if (cachedContent.children) {
      cachedContent.children.forEach((c) => {
        this._deleteCacheEntryFor({contentId: c});
      });
    }
    cachedContent.childrenArgs = null;
    cachedContent.children = null;
    if (cachedContent.childrenSubscription) {
      cachedContent.childrenSubscription.unsubscribe();
      cachedContent.childrenSubscription = null;
    }
  }

  _deleteCacheEntryFor({contentId}) {
    const stringId = ContentManager._toStringId({contentId});
    const cachedContent = this._cache.contents[stringId];
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
    delete this._cache.contents[stringId];
  }

  async _ensureCachedChildrenFor({contentId}) {
    const stringId = ContentManager._toStringId({contentId});
    this._ensureCacheEntryFor({contentId});

    const cachedContent = this._cache.contents[stringId];

    // check arguments first to see if we already have a calculated value
    const newArgs = await cachedContent.fn.childrenArguments({project: this._project, contentId});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs: cachedContent.childrenArgs});

    if (!areArgsSame) {
      console.log(`Child Cache miss for: ${stringId}`);
    }

    if (cachedContent.childrenArgs !== null && areArgsSame) {
      return;
    }
    const newChildren = await cachedContent.fn.children(newArgs);
    cachedContent.childrenArgs = newArgs;
    cachedContent.children = newChildren;

    if (!cachedContent.childrenSubscription) {
      cachedContent.childrenSubscription  = cachedContent.fn.childrenWatcher$(newArgs)
        .subscribe(this._childrenSubscriptionFnFor.bind(this, {contentId}));
    }
  }
}
ContentManager._toStringId = ({contentId}) => {
  const invalidContentIds = contentId.filter(ci => ci.indexOf("/") > -1);
  if (invalidContentIds.length > 0) {
    throw new Error(`${invalidContentIds.join(",")} contain reserved chars in the id.`)
  }
  return contentId.join("/");
};
