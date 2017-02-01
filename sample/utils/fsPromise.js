import Promise from "bluebird";
import fs from "fs-extra";

export default Promise.promisifyAll(fs);
