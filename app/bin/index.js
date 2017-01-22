import {Fil} from "../index"
import path from "path";
import parseArgs from "minimist";

const argv = parseArgs(process.argv, {
  boolean: "dynamic"
});

console.log(process.version);

const projectRootFile = require(path.join(process.cwd(), "index.js")).default;
const projectRunner = Fil.createProject({project: projectRootFile});

if (argv.dynamic) {
  projectRunner.generateDynamic()
    .catch((e) => { console.log(e) });
} else {
  projectRunner.generateStatic()
    .then(() => { console.log("cool") })
    .catch((e) => { console.log(e) });
}
