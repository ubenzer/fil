import experimentalHandler from "./routes/handler1";
import {postCollection} from "./contentTypes/postCollection";
import {post} from "./contentTypes/post";
import path from "path";

export class Project {

  contentTypes() {
    return {posts: postCollection, post};
  }

  routeHandlers() {
    return {experimentalHandler};
  }

  outPath() { return "./dist"; }

  cachePath() { return "./cache"; }
}
Project.contentPath = "contents";
Project.postPath = path.join("contents", "post");
const project = new Project();
export default project;
