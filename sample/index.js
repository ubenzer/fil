import experimentalHandler from "./routes/handler1";
import postCollection from "./contentTypes/postCollection";
import post from "./contentTypes/post";

class Project {

  contentTypes() {
    return {posts: postCollection, post};
  }

  routeHandlers() {
    return {experimentalHandler};
  }

  outPath() { return "./dist"; }

  cachePath() { return "./cache"; }
}
const project = new Project();
export default project;
