import {binaryPassthroughHandler} from "./routes/postAttachmentPassthroughHandler"
import {chokidar$} from "./utils/chokidar"
import {compressedImage} from "./contentTypes/compressedImage";
import {file} from "./contentTypes/file"
import {image} from "./contentTypes/image"
import path from "path"
import {post} from "./contentTypes/post"
import {postCollection} from "./contentTypes/postCollection"
import {recentPostsCollectionHandler} from "./routes/recentPostsCollectionHandler"
import {scaledImage} from "./contentTypes/scaledImage"
import {singlePostHandler} from "./routes/singlePostHandler"
import {cssCollection} from "./contentTypes/templateItems/cssCollection";
import {templateCssHandler} from "./routes/templateCssHandler";
import {templateCollection} from "./contentTypes/templateItems/templateCollection";

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
      scaledImage,
      templates: templateCollection
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
  }
}

export {project, contentPath, postSubfolder, postPath, templateSubfolder, templatePath}
export default project
