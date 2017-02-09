import Promise from "bluebird";
import fs from "fs-extra";
import path from "path";
import recursiveReaddirOriginal from "recursive-readdir";

const recursiveReaddirAsync = Promise.promisify(recursiveReaddirOriginal);
const fsPromise = Promise.promisifyAll(fs);

const getFoldersIn = async (p) => {
  const allFiles = await fsPromise.readdirAsync(p);
  return allFiles.filter(f => fs.statSync(path.join(p, f)).isDirectory());
};

const recursiveReaddir = async (path) => recursiveReaddirAsync(path);

const requireUncached = (module) => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

const chunk = ({array, chunkSize}) => {
  const tbReturned = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    tbReturned.push(array.slice(i, i + chunkSize));
  }
  return tbReturned;
};

// https://gist.github.com/spion/8c9d8556697ed61108177164e90fb50d
const translateError = (e) => e;

export {requireUncached, getFoldersIn, recursiveReaddir, fsPromise, chunk, translateError};




