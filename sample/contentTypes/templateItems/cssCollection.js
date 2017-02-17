import {templatePath, templateSubfolder} from "../../index"
import {chokidar$} from "../../utils/chokidar"
import globby from "globby"
import {pathToIdPart} from "../../utils/id"

export const cssCollection = {
  children: async () =>
    globby(["**/*.css"], {
      cwd: templatePath,
      nodir: true
    })
    .then((files) =>
      files.map((file) => {
        const childId = pathToIdPart({p: file})
        return `file@${templateSubfolder}/${childId}`
      })
    ),
  childrenWatcher$: () => chokidar$(`${templatePath}/**/*.css`, {ignoreInitial: true}),
  content: async () => ({})
}
