import {staticAssetsPath, staticAssetsSubfolder} from "../index"
import {chokidar$} from "../utils/chokidar"
import globby from "globby"
import {pathToIdPart} from "../utils/id"

export const staticAssetsCollection = {
  children: async () =>
    globby(["**/*"], {
      cwd: staticAssetsPath,
      nodir: true
    })
    .then((files) =>
      files.map((file) => {
        const childId = pathToIdPart({p: file})
        return `file@/${staticAssetsSubfolder}/${childId}`
      })
    ),
  childrenWatcher$: () => chokidar$(`${staticAssetsPath}/**/*`, {ignoreInitial: true}),
  content: async () => ({})
}
