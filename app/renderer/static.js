import Rx from 'rxjs/Rx';
import path from "path";
import fs from "fs-extra";

export class StaticRenderer {
  constructor({project}) {
    this._project = project;
  }

  async render() {
    return Rx.Observable.fromPromise(this._project.handles())
      .flatMap(url => url)
      .mergeMap(url => this._project.handle({url}), (url, {headers, body}) => ({headers, body, url}))
      .flatMap(({headers, body, url}) => {
        const pathToWrite = path.join(process.cwd(), this._project.outPath(), url) + ".html";
        const outputFile = Rx.Observable.bindNodeCallback(fs.outputFile);
        return outputFile(pathToWrite, body);
      })
      .toPromise();
  }
}
