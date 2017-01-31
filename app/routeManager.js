import Rx from 'rxjs/Rx';
import utils from './utils/utils';
import {Project} from "./project";

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

  async handles() {
    return Rx.Observable.from(this._handlerIdList())
      .flatMap((handlerId) => this._handledUrlListFor({handlerId}))
      .reduce((acc, handlerUrlArray) => [...acc, ...handlerUrlArray], [])
      .reduce((acc, url) => [...acc, ...url], [])
      .toPromise();
  }
  async handle({url}) {
    return Rx.Observable.from(this._handlerIdList())
      .flatMap((handlerId) => Promise.all([this._handledUrlListFor({handlerId}), handlerId]))
      .map(([handledUrlArray, handlerId]) => ({handledUrlArray, handlerId}))
      .filter((handler) => handler.handledUrlArray.indexOf(url) > -1)
      .reduce((acc, aHandlerObj) => [...acc, aHandlerObj], [])
      .flatMap(handlerUrlLookupArray => {
        if (handlerUrlLookupArray.length > 1) {
          throw new Error(`"${url}" is handled by ${handlerUrlLookupArray.length} handlers: 
            ${handlerUrlLookupArray.map(h => h.handlerId).join(",")}` )
        }
        if (handlerUrlLookupArray.length === 0) {
          throw new Error(`"${url}" is not handled by a route handler`)
        }
        const handler = handlerUrlLookupArray[0];
        return this._handleUrlVia({url, handlerId: handler.handlerId});
      })
      .toPromise();
      // .map(y => { debugger; return y;})
  }

  /* Private operations */
  _handlerIdList() {
    this._ensureHandlers();
    return Object.keys(this._cache.handlers);
  }

  async _handledUrlListFor({handlerId}) {
    this._ensureHandler({handlerId});
    const handler = this._cache.handlers[handlerId];
    if (!handler) {
      throw new Error(`Handler with id ${handlerId} not found!`);
    }

    // check arguments first to see if we already have a calculated value
    const newArgs = await handler.instance.handlesArguments({project: this._project});
    const areArgsSame = Project._compareArgumentCache({newArgs, oldArgs: handler.handlesArgs});
    if (handler.handles !== null && areArgsSame) {
      return handler.handles;
    }
    const newUrlList = await handler.instance.handles(newArgs);
    handler.handlesArgs = newArgs;
    handler.handles = newUrlList;
    return newUrlList;
  }

  async _handleUrlVia({url, handlerId}) {
    this._ensureHandler({handlerId});
    const handlerInstance = this._cache.handlers[handlerId].instance;
    return handlerInstance.handle({url, utils, project: this._project});
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
