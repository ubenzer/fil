import Rx from 'rxjs/Rx';
import chokidar from 'chokidar';
import path from "path";
import {postPath, postSubfolder} from "../index";
import {fsPromise} from "../../app/utils/misc";
import {rawContentToPostObject} from "../utils/post";
import globby from "globby";
import {idToPath, isPathImage, pathToIdPart} from "../utils/id";
import {chokidar$} from "../utils/chokidar";

export const post = {
  childrenWatcher$: ({id}) => (
    chokidar$(path.join(postPath, idToPath({id})), {
      ignored: ["**/.*", "index.md", "**/"],
      ignoreInitial: true,
      depth: 3
    })
  ),
  children: async ({id}) => {
    const p = idToPath({id});
    return globby(["**/*", "!index.md", "!**/.*"], {
      cwd: path.join(postPath, p),
      nodir: true
    })
    .then(files => (
      files.map(file => {
        const childPath = path.join(p, file);
        const childId = pathToIdPart({p: childPath});
        return isPathImage({p: childPath}) ? `image@${postSubfolder}/${childId}` : `file@${postSubfolder}/${childId}`;
      })
    ));
  },
  content: async ({id}) => {
    const rawFileContent = await fsPromise.readFileAsync(path.join(postPath, idToPath({id}), "index.md"), "utf8");
    return rawContentToPostObject({rawFileContent});
  },
  contentWatcher$: ({id}) => (
    Rx.Observable.create((subscriber) => {
      const watcher = chokidar.watch(
        path.join(postPath, idToPath({id}), "index.md"),
        {ignoreInitial: true}
      );
      watcher.on('all', () => { subscriber.next(); });
      return () => watcher.close();
    }).publish().refCount()
  )
};

