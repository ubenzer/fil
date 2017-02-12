import {RouteManager} from "./routeManager";
import {ContentManager} from "./contentManager";
import deepEql from "deep-eql";
import Rx from 'rxjs/Rx';

export class Project {
  constructor({project}) {
    this._project = project;
    this._routeManager = new RouteManager({project: this});
    this._contentManager = new ContentManager({project: this});
  }

  // Route related stuff
  async handledUrlsPerHandler() { return this._routeManager.handledUrlsPerHandler(); }
  async handledUrls() { return this._routeManager.handledUrls(); }
  async handle({url}) { return this._routeManager.handle({url}); }

  // Content related stuff
  async contentTypes() { // returns an array of registered types
    return this._contentManager.contentTypes();
  }
  async metaOf({id}) { // returns all contents registered to a type
    return this._contentManager.metaOf({id});
  }

  async valueOf({id}) {
    return this._contentManager.valueOf({id});
  }

  async persistCache() {
    return Promise.all([
      this._contentManager.persistCache(),
      this._routeManager.persistCache(),
    ]);
  }

  async loadCache() {
    return Promise.all([
      this._contentManager.loadCache(),
      this._routeManager.loadCache(),
    ]);
  }

  watcher$() {
    return Rx.Observable.merge(
      this._contentManager.watcher$(),
      this._project.watcher$()
    );
  }

  outPath() { return this._project.outPath(); }
  cachePath() { return this._project.cachePath(); }
}
Project._compareArgumentCache = ({newArgs, oldArgs}) => {
  return deepEql(newArgs, oldArgs);
};
