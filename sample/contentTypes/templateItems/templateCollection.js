import {chokidar$} from "../../utils/chokidar"
import globby from "globby"
import {pathToIdPart} from "../../utils/id"
import {templatePath, templateSubfolder} from "../../index"

export const templateCollection = {
  children: async () =>
    globby(["**/*.js"], {
      cwd: templatePath,
      nodir: true
    })
    .then((files) =>
      files.map((file) => {
        const childId = pathToIdPart({p: file})
        return `file@${templateSubfolder}/${childId}`
      })
    ),
  childrenWatcher$: () =>
    chokidar$(templatePath, {
      ignoreInitial: true,
      ignored: ["**/.*", "**/", "!**/*.js"]
    }),
  content: async () => ({})
}
