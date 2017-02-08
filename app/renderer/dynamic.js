import http from "http";
import browserSync from "browser-sync";
import {translateError} from "../utils";

export class DynamicRenderer {
  constructor({project}) {
    this._project = project;
  }

  async handleRequest(request, response) {
    const url = request.url;

    const handledUrlList = await this._project.handles().catch(translateError);
    if (handledUrlList instanceof Error) {
      console.error(handledUrlList);
      response.writeHead(500);
      response.end("500 - Check console");
      return;
    }

    if (url === "/?urlList") {
      const body =  [`${handledUrlList.length} urls`, ...handledUrlList].join("\n");
      response.writeHead(200, {
        "Content-Type": "text/plain"
      });
      response.write(body);
      response.end();
      return;
    } else if (handledUrlList.indexOf(url) === -1) {
      response.writeHead(404, {
        "Content-Type": "text/plain"
      });
      response.write("404 - Nein!");
      response.end();
      return;
    }

    try {
      const generatedPage = await this._project.handle({url}).catch(translateError);
      if (generatedPage instanceof Error) {
        console.error(handledUrlList);
        response.writeHead(500);
        response.end("500 - Check console");
        return;
      }
      const {headers, body} = generatedPage;
      response.writeHead(200, headers);
      response.write(body);
      response.end();
    } catch (e) {
      console.error(e);
      response.end(`${e.message}`);
    }
  }

  async render() {
    return new Promise((resolve, reject) => {
      http.createServer(this.handleRequest.bind(this))
        .listen(4000, (err) => {
          if (err) {
            reject(err);
            return;
          }
          const bs = browserSync.create();
          bs.init({
            proxy: "localhost:4000",
            open: false
          });
          this._project.watcher$().subscribe(() => {
            bs.reload();
          });
          resolve();
        });
    });
  }
}
