import {RouteHandler} from "./routeHandler";

export class Project {
  constructor({project}) {
    this._project = project;
    this._routeHandler = new RouteHandler({project: this._project});

    this._cache = {
      contents: {
        id: {
          children: null,
          content: "hello",
          isBinary: false,
          contentSubscription: null,
          contentArgs: null,
          childrenSubscription: null,
          childrenArgs: null
        }
      }
    };
  }

  init() {

  }


  // Route handler related stuff
  async handles() { return this._routeHandler.handles(); }
  async handle({url}) { return this._routeHandler.handle({url}); }





  async contentTypes() { // returns an array of registered types
    return ["post", "meta"];
  }

  async metaOf(contentId) { // returns all contents registered to a type
    return {
      id: contentId,
      type: "post",
      hasChild: true,
      children: [["id list"]]
    }
  }

  async valueOf(contentId) {
    // returns whatever value that content has
  }

  outPath() { return this._project.outPath(); }

  config() { }
}
