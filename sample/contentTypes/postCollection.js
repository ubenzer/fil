import Rx from 'rxjs/Rx';
import chokidar from 'chokidar';
import path from "path";
import fs from "fs";

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
  async childrenArguments({contentId}) {
    return {contentId}
  }
  async children({contentId}) {
    const readdir = Rx.Observable.bindNodeCallback(fs.readdir);
    return readdir(PostCollection.contentPath)
      .flatMap(f => f)
      .filter(f => fs.statSync(path.join(PostCollection.contentPath, f)).isDirectory())
      .map(name => [...contentId, name])
      .reduce((acc, one) => [...acc, one], [])
      .toPromise();
  }

  async contentArguments() {
    return {}
  }
  async content() {
    return {}
  }
}
PostCollection.contentPath = path.join(process.cwd(), "contents");
export default new PostCollection();
