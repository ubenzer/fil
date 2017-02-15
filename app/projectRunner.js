import {DynamicRenderer} from "./renderer/dynamic"
import {Project} from "./project"
import {StaticRenderer} from "./renderer/static"

export class ProjectRunner {
  constructor({project, listenToChanges, useCache}) {
    this._project = new Project({listenToChanges, project, useCache})
    this._useCache = useCache
  }

  async init() {
    await this._project.initCache()
    this._project.initChangeListeners()
  }

  async generateStatic() {
    await new StaticRenderer({project: this._project}).render()
    this._project.disposeChangeListeners()
  }

  async generateDynamic() {
    return new DynamicRenderer({project: this._project}).render()
  }

  async persistCache() {
    if (!this._useCache) { return }
    return this._project.persistCache()
  }
}
