import {idForTemplateCss, pathToIdPart} from "../../utils/id"
import {templatePath, templateSubfolder} from "../../index"
import {chokidar$} from "../../utils/chokidar"
import globby from "globby"

export const cssCollection = {
  children: async () =>
    globby(["**/*.css"], {
      cwd: templatePath,
      nodir: true
    })
    .then((files) =>
      files.map((file) => {
        const childId = pathToIdPart({p: file})
        return idForTemplateCss({url: `${templateSubfolder}/${childId}`})
      })
    ),
  childrenWatcher$: () => chokidar$(`${templatePath}/**/*.css`, {ignoreInitial: true}),
  content: async () => ({})
}
