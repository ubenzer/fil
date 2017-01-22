import Rx from 'rxjs/Rx';
import chokidar from 'chokidar';
import path from "path";
import fs from "fs";
import Post from "./post";

export class PostCollection {
  async contents() {
    const readdir = Rx.Observable.bindNodeCallback(fs.readdir);
    return readdir(PostCollection.contentPath)
      .flatMap(f => f)
      .filter(f => fs.statSync(path.join(PostCollection.contentPath, f)).isDirectory())
      .map(name => new Post(name))
      .reduce((acc, one) => [...acc, one], [])
      .toPromise();
  }

  watcher$() {
    return Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        PostCollection.contentPath,
        {ignored: /(^|[\/\\])\../, ignoreInitial: true}
      );
      watcher.on('all', () => { subscriber.next(); });
      //subscriber.complete();
      return () => watcher.close();
    }).publish().refCount();
  }
}
PostCollection.contentPath = path.join(process.cwd(), "contents", "post");
export default new PostCollection();
