import {RouteManager} from "./routeManager";
import {ContentManager} from "./contentManager";
import deepEql from "deep-eql";

export class Project {
  constructor({project}) {
    this._project = project;
    this._routeManager = new RouteManager({project: this});
    this._contentManager = new ContentManager({project: this});
  }

  // Route related stuff
  async handles() { return this._routeManager.handles(); }
  async handle({url}) { return this._routeManager.handle({url}); }

  // Content related stuff
  async contentTypes() { // returns an array of registered types
    return this._contentManager.contentTypes();
  }
  async metaOf({contentId}) { // returns all contents registered to a type
    return this._contentManager.metaOf({contentId});
  }

  async valueOf({contentId}) {
    return this._contentManager.valueOf({contentId});
  }

  outPath() { return this._project.outPath(); }
  cachePath() { return this._project.cachePath(); }

  config() { throw new Error("Not implemented"); }
}
Project._compareArgumentCache = ({newArgs, oldArgs}) => {
  return deepEql(newArgs, oldArgs);
};
