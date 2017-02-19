import Promise from "bluebird"
import {chokidar$} from "../../utils/chokidar"
import {fsPromise} from "../../../app/utils/misc"
import path from "path"
import stylus from "stylus"
import {templatePath} from "../../index"

const renderAsync = Promise.promisify(stylus.render)

const styls = {
  content: async () => {
    const p = path.join(templatePath, "index.styl")
    const strContent = await fsPromise.readFileAsync(p, "utf8")

    return renderAsync(strContent, {filename: p})
      .then((css) => ({content: css}))
  },
  contentWatcher$: () => chokidar$(`${templatePath}/**/*.styl`, {ignoreInitial: true})
}

export {styls as stylus}
