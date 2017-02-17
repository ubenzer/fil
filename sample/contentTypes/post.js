import {idToPath, isPathImage, pathToIdPart} from "../utils/id"
import {postPath, postSubfolder} from "../index"
import {chokidar$} from "../utils/chokidar"
import {fsPromise} from "../../app/utils/misc"
import globby from "globby"
import path from "path"
import {rawContentToPostObject} from "../utils/post"

export const post = {
  children: async ({id}) => {
    const p = idToPath({id})

    return globby(["**/*", "!index.md", "!**/.*"], {
      cwd: path.join(postPath, p),
      nodir: true
    })
    .then((files) =>
      files.map((file) => {
        const childPath = path.join(p, file)
        const childId = pathToIdPart({p: childPath})

        return isPathImage({p: childPath}) ? `image@${postSubfolder}/${childId}` : `file@${postSubfolder}/${childId}`
      })
    )
  },
  childrenWatcher$: ({id}) =>
    chokidar$(path.join(postPath, idToPath({id})), {
      ignoreInitial: true,
      ignored: ["**/.*", path.join(postPath, idToPath({id}, "index.md")), "**/"]
    }),
  content: async ({id}) => {
    const rawFileContent = await fsPromise.readFileAsync(path.join(postPath, idToPath({id}), "index.md"), "utf8")

    return rawContentToPostObject({rawFileContent})
  },
  contentWatcher$: ({id}) => chokidar$(path.join(postPath, idToPath({id}), "index.md"), {ignoreInitial: true})
}

