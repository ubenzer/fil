import {Project} from "./project";
import {StaticRenderer} from "./renderer/static";
import {DynamicRenderer} from "./renderer/dynamic";

export class ProjectRunner {
  constructor({project}) {
    this._project = new Project({project});
  }

  async generateStatic() {
    return new StaticRenderer({
      project: this._project
    }).render();
  }

  async generateDynamic() {
    return new DynamicRenderer({
      project: this._project
    }).render();
  }

  async persistCache() {
    return this._project.persistCache();
  }

  async loadCache() {
    return this._project.loadCache();
  }
}
