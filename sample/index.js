import {binaryPassthroughHandler} from "./routes/postAttachmentPassthroughHandler"
import {chokidar$} from "./utils/chokidar"
import {file} from "./contentTypes/file"
import {image} from "./contentTypes/image"
import path from "path"
import {post} from "./contentTypes/post"
import {postCollection} from "./contentTypes/postCollection"
import {recentPostsCollectionHandler} from "./routes/recentPostsCollectionHandler"
import {scaledImage} from "./contentTypes/scaledImage"
import {singlePostHandler} from "./routes/singlePostHandler"

const contentPath = "contents"
const postSubfolder = "post"
const postPath = path.join(contentPath, postSubfolder)
const templatePath = path.join("templates")

const project = {
  cachePath() {
    return "./cache"
  },
  contentTypes() {
    return {
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
      singlePostHandler
    }
  },
  // Observable for changes that doesn't belong to any content (such as templates)
  watcher$() {
    return chokidar$(templatePath,
      {
        ignoreInitial: true,
        ignored: ["**/.*"]
      }
    )
  }
}

export {project, contentPath, postSubfolder, postPath, templatePath}
export default project
