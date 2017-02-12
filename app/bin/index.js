import {Fil} from "../index"
import path from "path";
import parseArgs from "minimist";
import 'source-map-support/register';
import npid from 'npid';
import fs from "fs-extra";
import nodeCleanup from 'node-cleanup';

const argv = parseArgs(process.argv, {
  boolean: ["dynamic", "force"]
});

console.log( process.version);

const projectRootFile = require(path.join(process.cwd(), "index.js")).default;
const projectRunner = Fil.createProject({project: projectRootFile});

let pid = null;
try {
  const pidFolder = path.join(process.cwd(), projectRootFile.cachePath());
  fs.ensureDirSync(pidFolder);
  pid = npid.create(path.join(pidFolder, "running.pid"), argv.force);
} catch (err) {
  console.log(err);
  process.exit(-2);
}

nodeCleanup((exitCode, signal) => {
  console.log("Persisting cache...");
  projectRunner.persistCache()
    .catch(console.error)
    .then(() => {
      pid.remove();
      process.exitCode = 0;
      process.kill(process.pid, signal);
    });
  nodeCleanup.uninstall();
  return false;
});

if (argv.dynamic) {
  projectRunner.loadCache()
    .then(() => {
      projectRunner.generateDynamic();
    });
} else {
  projectRunner.loadCache()
    .then(() => {
      return projectRunner.generateStatic();
    })
    .catch((e) => {
      console.log(e);
    })
    .then(() => {
      process.kill(process.pid);
    });
}
