import {singlePostHandler} from "./routes/singlePostHandler";
import {recentPostsCollectionHandler} from "./routes/recentPostsCollectionHandler";
import {postCollection} from "./contentTypes/postCollection";
import {post} from "./contentTypes/post";
import path from "path";

export class Project {

  contentTypes() {
    return {posts: postCollection, post};
  }

  routeHandlers() {
    return {singlePostHandler, recentPostsCollectionHandler};
  }

  outPath() { return "./dist"; }

  cachePath() { return "./cache"; }
}
Project.contentPath = "contents";
Project.postPath = path.join("contents", "post");
const project = new Project();
export default project;
