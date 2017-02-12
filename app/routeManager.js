import {Project} from "./project";
import {binaryItemsFromDisk, binaryItemsToDisk} from "./utils/binaryCacheHelpers";
import * as path from "path";
import {fsPromise, translateError} from "./utils/misc";

export class RouteManager {
  constructor({project}) {
    this._project = project;
    this._cache = {
      // todo persist this
      handlers: {
        /*id: {
            handlesArgs: null,
            handles: ["/a", "/b"],
            instance: null // instanceof that particular handler
        }*/
      }
    };
  }

  async handledUrlsPerHandler() {
    const handlerList = this._handlerIdList();
    const urlListPerHandler = await Promise.all(handlerList.map((handlerId) => this._handledUrlListFor({handlerId})));

    return handlerList.reduce((acc, handlerId, index) => ({[handlerId]: urlListPerHandler[index], ...acc}), {});
  }

  async handledUrls() {
    const urlListPerHandler = await Promise.all(this._handlerIdList()
      .map((handlerId) => this._handledUrlListFor({handlerId})));
    return urlListPerHandler.reduce((acc, urlList) => [...acc, ...urlList], []);
  }

  async handle({url}) {
    const handledUrlsPerHandler = await this.handledUrlsPerHandler();
    const handlersIdsForUrl = Object.keys(handledUrlsPerHandler)
      .filter(handlerId => handledUrlsPerHandler[handlerId].indexOf(url) > -1);

    if (handlersIdsForUrl.length !== 1) {
      throw new Error(`"${url}" is handled by ${handlersIdsForUrl.length} handlers: 
        ${handlersIdsForUrl.join(",")}`);
    }

    return this._handleUrlVia({url, handlerId: handlersIdsForUrl[0]});
  }

  /* Private operations */
  _handlerIdList() {
    this._ensureHandlers();
    return Object.keys(this._cache.handlers);
  }

  async _handledUrlListFor({handlerId}) {
    this._ensureHandler({handlerId});

    const accountingKey = RouteManager.binaryFieldDesriptorKey;
    const cachePath = this._project.cachePath();

    const handler = this._cache.handlers[handlerId];
    if (!handler) {
      throw new Error(`Handler with id ${handlerId} not found!`);
    }

    // check arguments first to see if we already have a calculated value
    const oldArgs = await binaryItemsFromDisk({
      id: handlerId,
      type: RouteManager.binaryCacheTypes.handlesArgs,
      json: handler.handlesArgs,
      cachePath,
      accountingKey
    });
    const newArgs = await handler.instance.handlesArguments({project: this._project});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs});

    if (!areArgsSame) {
      console.log(`Route Cache miss for: ${handlerId}`);
    }

    if (handler.handles !== null && areArgsSame) {
      return handler.handles;
    }
    const newUrlList = await handler.instance.handles(newArgs);
    handler.handlesArgs = await binaryItemsToDisk({
      id: handlerId,
      type: RouteManager.binaryCacheTypes.handlesArgs,
      json: newArgs,
      cachePath,
      accountingKey
    });
    handler.handles = newUrlList;
    return newUrlList;
  }

  async _handleUrlVia({url, handlerId}) {
    this._ensureHandler({handlerId});
    const handlerInstance = this._cache.handlers[handlerId].instance;
    return handlerInstance.handle({url, project: this._project});
  }

  async persistCache() {
    const cacheHandlersWithoutFns =
      Object.keys(this._cache.handlers)
        .map(id => {
          const cacheItemCopy = {...this._cache.handlers[id]};
          cacheItemCopy.instance = null;
          return {id, cacheItemCopy};
        })
        .reduce((acc, {id, cacheItemCopy}) =>
            ({[id]: cacheItemCopy, ...acc})
          , {});
    const cache = {handlers: cacheHandlersWithoutFns};
    const filePath = path.join(this._project.cachePath(), "routes.json");
    return fsPromise.outputJsonAsync(filePath, cache);
  }

  async loadCache() {
    const filePath = path.join(this._project.cachePath(), "routes.json");
    const json = await fsPromise.readJsonAsync(filePath).catch(translateError);
    if (json instanceof Error) {
      // means we have no cache at all.
      return;
    }

    this._cache = json;
  }

  /* Cache operations */
  _ensureHandler({handlerId}) {
    if (!this._cache.handlers[handlerId]) {
      this._cache.handlers[handlerId] = {
        handlesArgs: null,
        handles: null,
        instance: null
      };
    }
    const handlerCache = this._cache.handlers[handlerId];
    if (!handlerCache.instance) {
      const handlers = this._project._project.routeHandlers();
      // const HandlerC = handlers[handlerId];
      // handlerCache.instance = new HandlerC();
      handlerCache.instance = handlers[handlerId];
    }
  }

  _ensureHandlers() {
    const handlers = this._project._project.routeHandlers();
    Object.keys(handlers).forEach((handlerId) => {
      this._ensureHandler({handlerId});
    });
  }
}
RouteManager.binaryFieldDesriptorKey = "_binaryFields";
RouteManager.binaryCacheTypes = {
  handlesArgs: "handlesArgs"
};

