import {binaryPassthroughHandler} from "./routes/postAttachmentPassthroughHandler"
import {chokidar$} from "./utils/chokidar"
import {compressedImage} from "./contentTypes/compressedImage"
import {cssCollection} from "./contentTypes/templateItems/cssCollection"
import {file} from "./contentTypes/file"
import {image} from "./contentTypes/image"
import path from "path"
import {post} from "./contentTypes/post"
import {postCollection} from "./contentTypes/postCollection"
import {recentPostsCollectionHandler} from "./routes/recentPostsCollectionHandler"
import {scaledImage} from "./contentTypes/scaledImage"
import {singlePostHandler} from "./routes/singlePostHandler"
import {templateCssHandler} from "./routes/templateCssHandler"

const contentPath = "contents"
const postSubfolder = "post"
const templateSubfolder = "template"
const postPath = path.join(contentPath, postSubfolder)
const templatePath = path.join(contentPath, templateSubfolder)

const project = {
  cachePath() {
    return "./cache"
  },
  contentTypes() {
    return {
      compressedImage,
      csses: cssCollection,
      file,
      image,
      post,
      posts: postCollection,
      scaledImage
    }
  },
  outPath() {
    return "./dist"
  },
  routeHandlers() {
    return {
      binaryPassthroughHandler,
      recentPostsCollectionHandler,
      singlePostHandler,
      templateCssHandler
    }
  },
  // Observable for changes that doesn't belong to any content (such as templates)
  watcher$() {
    return chokidar$(`${templatePath}/**/*.js`, {ignoreInitial: true})
  }
}

export {project, contentPath, postSubfolder, postPath, templateSubfolder, templatePath}
export default project
