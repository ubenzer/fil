import Rx from 'rxjs/Rx';
import chokidar from 'chokidar';
import path from "path";
import fs from "fs";
import fsPromise from "../utils/fsPromise";

export class PostCollection {
  childrenWatcher$() {
    return Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        PostCollection.contentPath,
        {ignored: /(^|[\/\\])\../, ignoreInitial: true, depth: 1}
      );
      watcher.on('all', () => { subscriber.next(); });
      //subscriber.complete();
      return () => watcher.close();
    }).publish().refCount();
  }
  async childrenArguments() { return {}; }
  async children() {
    const fullPath = path.join(PostCollection.contentPath, "post");
    return fsPromise.readdirAsync(fullPath)
      .then((paths) =>
         paths
          .filter(f => fs.statSync(path.join(PostCollection.contentPath, "post", f)).isDirectory())
          .map(name => ["post", name])
      );
  }

  async contentArguments() {
    return {}
  }
  async content() {
    return {}
  }
  contentWatcher$() { return Rx.Observable.empty(); }
}
PostCollection.contentPath = path.join(process.cwd(), "contents");
export default new PostCollection();
