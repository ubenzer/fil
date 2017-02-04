import {fsPromise} from "../utils";
import path from "path";

export class StaticRenderer {
  constructor({project}) {
    this._project = project;
  }

  async render() {
    const urlList = await this._project.handles();

    // render pages one by one
    for (const url of urlList) {
      const {headers, body} = await this._project.handle({url});
      const pathToWrite = path.join(this._project.outPath(), url, "index.html");
      await fsPromise.outputFileAsync(pathToWrite, body);
    }

    // render pages in parallel
    // return Promise.all(urlList.map(url => {
    //   return this._project.handle({url}).then(({headers, body}) => {
    //     const pathToWrite = path.join(this._project.outPath(), url, "index.html");
    //     return fsPromise.outputFileAsync(pathToWrite, body);
    //   });
    // }));
  }
}
