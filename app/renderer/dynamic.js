import http from "http";
import browserSync from "browser-sync";

export class DynamicRenderer {
  constructor({project}) {
    this._project = project;
  }

  async handleRequest(request, response) {
    const url = request.url;

    try {
      const {headers, body} = await this._project.handle({url});
      response.end(body);
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
