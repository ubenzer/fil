import Rx from 'rxjs/Rx';
import path from "path";
import fs from "fs";
import {PostCollection} from "./postCollection";
import MarkdownIt from "markdown-it";

export default class Post {

  constructor([id]) {
    this._id = id;
    this._md = new MarkdownIt();
  }

  id() { return this._id; }
  isPrimitive() { return false; }

  containsWatcher$() {

  }
  containsArguments() {

  }
  async contains() {
    return [["id array"]] // type
  }

  contentWatcher$() {}
  contentArguments() {
    return {}
  }
  async content() {
    const readFile = Rx.Observable.bindNodeCallback(fs.readFile);
    return readFile(path.join(PostCollection.contentPath, this.id(), "index.md"), "utf8")
      .map(content => this._md.render(content))
      .toPromise();
  }
}
