import Rx from 'rxjs/Rx';
import path from "path";
import fs from "fs";
import {PostCollection} from "./postCollection";
import MarkdownIt from "markdown-it";
import chokidar from 'chokidar';

export class Post {
  constructor() {
    this._md = new MarkdownIt();
  }

  childrenWatcher$({contentId}) {
    return Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        path.join(PostCollection.contentPath, ...contentId),
        {ignored: /(^|[\/\\])\../, ignoreInitial: true, depth: 1}
      );
      watcher.on('all', () => { subscriber.next(); });
      //subscriber.complete();
      return () => watcher.close();
    }).publish().refCount();  // TODO ignore index.md
  }
  childrenArguments({contentId}) {
    return {contentId}
  }
  async children({contentId}) {
    const readdir = Rx.Observable.bindNodeCallback(fs.readdir);
    return readdir(path.join(PostCollection.contentPath, ...contentId))
      .flatMap(f => f)
      .filter(f => !(fs.statSync(path.join(PostCollection.contentPath, f)).isDirectory()))
      .map(name => [...contentId, name])
      .reduce((acc, one) => [...acc, one], [])
      .toPromise();
  }

  contentWatcher$({contentId}) {
    return Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        path.join(PostCollection.contentPath, ...contentId, "index.md"),
        {ignored: /(^|[\/\\])\../, ignoreInitial: true, depth: 1}
      );
      watcher.on('all', () => { subscriber.next(); });
      //subscriber.complete();
      return () => watcher.close();
    }).publish().refCount();
  }
  async contentArguments({contentId}) {
    return {contentId}
  }
  async content({contentId}) {
    const readFile = Rx.Observable.bindNodeCallback(fs.readFile);
    return readFile(path.join(PostCollection.contentPath, ...contentId, "index.md"), "utf8")
      .map(content => this._md.render(content))
      .toPromise();
  }
}
const post = new Post();
export default post;

