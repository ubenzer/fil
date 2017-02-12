import deepIterator from 'deep-iterator';
import * as dotProp from "dot-prop-immutable";
import * as path from "path";
import sanitize from "sanitize-filename";
import {fsPromise} from "./misc";

const binaryItemsToDisk = async ({id, type, json, cachePath, accountingKey}) => {
  if (!json) { return json; }

  const iterator = deepIterator(json, {
    onlyLeaves: true,
    skipIteration: (node) => node.value instanceof Buffer
  });

  // determine paths to buffer typed keys
  const binaryFields = [];
  for (const {value, path} of iterator) {
    if (value instanceof Buffer) {
      binaryFields.push({value, path});
    }
  }

  const newJson = binaryFields.reduce((acc, {path}) => dotProp.delete(acc, path), json);
  newJson[accountingKey] = binaryFields.map(bf => bf.path);

  await Promise.all(binaryFields.map(({value, path}) => {
    const filePath = pathForCacheItem({cachePath, id, type, keyPath: path});
    return fsPromise.outputFileAsync(filePath, value);
  }));

  return newJson;
};

const binaryItemsFromDisk = async ({id, type, json, cachePath, accountingKey}) => {
  if (!json) { return json; }

  const binaryFields = json[accountingKey] || [];
  const binaryPaths = binaryFields.map(bf => pathForCacheItem({cachePath, id, type, keyPath: bf}));

  const binaryDataArr = await Promise.all(binaryPaths.map(bp => fsPromise.readFileAsync(bp)));

  const newJson = binaryDataArr.reduce((acc, bd, idx) => (
    dotProp.set(acc, binaryFields[idx], bd)
  ), json);
  delete newJson[accountingKey];
  return newJson;
};

const clearBinaryItemsFromDisk = async ({id, type, json, cachePath, accountingKey}) => {
  if (!json) { return json; }

  const binaryFields = json[accountingKey] || [];
  const binaryPaths = binaryFields.map(bf => pathForCacheItem({cachePath, id, type, keyPath: bf}));

  return Promise.all(binaryPaths.map(bp => fsPromise.removeFileAsync(bp)));
};

const pathForCacheItem = ({cachePath, id, type, keyPath}) => {
  const idParts = id.split(/(?:\/|\\|\||@|:)+/);
  const sanitizedPathParts = [...idParts, `${type}--${keyPath.join("--")}`].map(ip => sanitize(ip, {replacement: "_"}));

  return path.join(cachePath, ...sanitizedPathParts);
};

export {binaryItemsToDisk, binaryItemsFromDisk, clearBinaryItemsFromDisk};
