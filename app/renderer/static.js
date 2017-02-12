import {chunk, fsPromise} from "../utils/misc";
import path from "path";

export class StaticRenderer {
  constructor({project}) {
    this._project = project;
  }

  async render() {
    const urlListPerHandler = await this._project.handledUrlsPerHandler();
    const handlerIdBatches = chunk({array: Object.keys(urlListPerHandler), chunkSize: 5});

    for (const handlerIdBatch of handlerIdBatches) {
      await Promise.all(
        handlerIdBatch.map(async (handlerId) => {
          const urlBatches = chunk({array: urlListPerHandler[handlerId], chunkSize: 1});

          for (const batch of urlBatches) {
            await Promise.all(
              batch.map(url => (
                this._project.handle({url})
                  .then(({headers, body}) => (
                    this._renderSingle({url, headers, body})
                  ))
                  .catch(console.log)
              ))
            );
          }
        })
      );
    }
  }

  async _renderSingle({url, headers, body}) {
    const ext = path.extname(url);
    let pathToWrite = path.join(this._project.outPath(), url);

    if (ext.length === 0 && headers["Content-Type"].indexOf("text/html") > -1) {
      pathToWrite = path.join(pathToWrite, "index.html");
    }

    const headersFile = `${pathToWrite}.headers`;
    return Promise.all([
      fsPromise.outputFileAsync(pathToWrite, body),
      fsPromise.outputJsonAsync(headersFile, headers)
    ]);
  }
}
