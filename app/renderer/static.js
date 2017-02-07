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
      const ext = path.extname(url);
      let pathToWrite = path.join(this._project.outPath(), url);

      if (ext.length === 0 && headers["Content-Type"].indexOf("text/html") > -1) {
        pathToWrite = path.join(pathToWrite, "index.html");
      }

      const headersFile = `${pathToWrite}.headers`;
      await fsPromise.outputFileAsync(pathToWrite, body);
      await fsPromise.outputJsonAsync(headersFile, headers);
    }
  }
}
