import {singlePostHandler} from "./routes/singlePostHandler";
import {recentPostsCollectionHandler} from "./routes/recentPostsCollectionHandler";
import {postCollection} from "./contentTypes/postCollection";
import {post} from "./contentTypes/post";
import path from "path";
import Rx from 'rxjs/Rx';
import chokidar from 'chokidar';

const project = {
  contentTypes() {
    return {posts: postCollection, post};
  },
  routeHandlers() {
    return {singlePostHandler, recentPostsCollectionHandler};
  },
  outPath() { return "./dist"; },
  cachePath() { return "./cache"; },

  // Observable for changes that doesn't belong to any content (such as templates)
  watcher$() {
    return Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        templatePath,
        {
          ignored: ["**/.*"],
          ignoreInitial: true
        }
      );
      watcher.on('all', () => { subscriber.next(); });
      return () => watcher.close();
    }).publish().refCount()
  }
};
const contentPath = "contents";
const postPath = path.join(contentPath, "post");
const templatePath = path.join("templates");

export {project, contentPath, postPath, templatePath};
export default project;
