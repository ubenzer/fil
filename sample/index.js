import post from "./contentTypes/post";
import experimentalHandler from "./routes/handler1";
import postCollection from "./contentTypes/postCollection";

class Project {

  contentTypes() {
    return {postCollection};
  }

  routeHandlers() {
    return {experimentalHandler};
  }

  outPath() { return "./dist"; }

  cachePath() { return "./cache"; }
}
const project = new Project();
export default project;
