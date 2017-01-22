import Rx from 'rxjs/Rx';
import chokidar from 'chokidar';
import path from "path";
import fs from "fs";
import Post from "./post";

export class ComponentLifecycleCollection {
  constructor() {
    this._version = 0;
  }

  async contents() {
    const readdir = Rx.Observable.bindNodeCallback(fs.readdir);
    return readdir(ComponentLifecycleCollection.contentPath)
      .flatMap(f => f)
      .filter(f => fs.statSync(path.join(ComponentLifecycleCollection.contentPath, f)).isDirectory())
      .map(name => new Post(name))
      .reduce((acc, one) => [...acc, one], [])
      .toPromise();
  }

  watcher$() {
    return Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        ComponentLifecycleCollection.contentPath,
        {ignored: /(^|[\/\\])\../, ignoreInitial: true, depth: 0}
      );
      watcher.on('all', () => {
        this._version++;
        subscriber.next();
      });
      //subscriber.complete();
      return () => watcher.close();
    }).publish().refCount();
  }
}
ComponentLifecycleCollection.contentPath = path.join(process.cwd(), "contents", "post");
export default new ComponentLifecycleCollection();
