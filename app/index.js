import {ProjectRunner} from "./projectRunner";

class Fil {
  createProject(project) {
    return new ProjectRunner(project);
  }
}

const fil = new Fil();
export default fil;
export {fil as Fil};
