import path from "path"
import {templatePath} from "../index"

const requireUncached = (module) => {
  const templateModules = Object.keys(require.cache)
    .filter((c) => c.startsWith(path.join(process.cwd(), templatePath)))
  templateModules.push(path.join(process.cwd(), "config.js"))

  templateModules.forEach((tm) => delete require.cache[tm])
  return require(module) // eslint-disable-line global-require
}

export {requireUncached}
