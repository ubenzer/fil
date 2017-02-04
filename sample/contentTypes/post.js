import MarkdownIt from "markdown-it";
import Rx from 'rxjs/Rx';
import chokidar from 'chokidar';
import path from "path";
import {Project} from "../index";
import replace from "replaceall";
import {fsPromise, recursiveReaddir} from "../utils";

const md = new MarkdownIt();

const idToPath = (id) => replace("/", path.sep, id.split("@")[1]);

export const post = {
  childrenWatcher$: ({id}) => (
    Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        path.join(Project.postPath, idToPath(id)),
        {
          ignored: [".**", "index.md"],
          ignoreInitial: true
        }
      );
      watcher.on('all', () => { subscriber.next(); });
      return () => watcher.close();
    }).publish().refCount()
  ),
  childrenArguments: async ({id}) => ({id}),
  children: async ({id}) => {
    const p = idToPath(id);
    return recursiveReaddir(path.join(Project.postPath, p))
      .then((files) => `post@${p}/${files}`);
    // TODO use path.sep replace, TODO not files, but other types
  },
  contentArguments: async ({id}) => ({id}),
  content: async ({id}) => (
    fsPromise.readFileAsync(path.join(Project.postPath, idToPath(id), "index.md"), "utf8")
      .then(contents => md.render(contents))
  ),
  contentWatcher$: ({id}) => (
    Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        path.join(Project.postPath, idToPath(id), "index.md"),
        {ignoreInitial: true}
      );
      watcher.on('all', () => { subscriber.next(); });
      return () => watcher.close();
    }).publish().refCount()
  )
};

