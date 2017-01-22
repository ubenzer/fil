import PostCollection from "./contentTypes/postCollection";
import experimentalHandler from "./routes/handler1";

class Project {

  contentTypes() {
    return [PostCollection];
  }

  routeHandlers() {
    return {experimentalHandler};
  }

  watcher$() {
    return PostCollection.watcher$();
  }
  outPath() { return "./dist"; }
}
const project = new Project();
export default project;
