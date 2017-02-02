import Rx from 'rxjs/Rx';
import chokidar from 'chokidar';
import path from "path";
import {Project} from "../index";
import {getFoldersIn} from "../utils";

export const postCollection = {
  childrenWatcher$: () => (
    Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        Project.postPath,
        {
          ignored: ["**/*"],
          ignoreInitial: true,
          depth: 3
        }
      );
      watcher.on('addDir', () => { subscriber.next(); });
      watcher.on('unlinkDir', () => { subscriber.next(); });
      return () => watcher.close();
    }).publish().refCount()
  ),
  childrenArguments: async () => ({}),
  children: async () => {
    const years = await getFoldersIn(Project.postPath);
    const months = await Promise.all(
      years.map(year =>
        getFoldersIn(path.join(Project.postPath, year))
          .then(month => ({year, month})))
    );

    const posts = await Promise.all(
      months.map(({year, month}) =>
        getFoldersIn(path.join(Project.postPath, year, month))
          .then(postId => ({year, month, postId})))
    );

    return posts.map(({year, month, postId}) => `post@${year}/${month}/${postId}`);
  },
  contentArguments: async () => ({}),
  content: async () => ({}),
  contentWatcher$: () => Rx.Observable.empty()
};
