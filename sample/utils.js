import Promise from "bluebird";
import fs from "fs-extra";
import recursiveReaddirOriginal from "recursive-readdir";

const recursiveReaddirAsync = Promise.promisify(recursiveReaddirOriginal);
const fsPromise = Promise.promisifyAll(fs);

const getFoldersIn = async (path) => {
  const allFiles = await fsPromise.readdirAsync(path);
  return allFiles.filter(f => fs.statSync(path.join(path, f)).isDirectory());
};

const recursiveReaddir = async (path) => recursiveReaddirAsync(path);


export {getFoldersIn, recursiveReaddir, fsPromise};




