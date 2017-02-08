import replace from "replaceall";
import path from "path";
import {IMAGE_EXTENSIONS} from "./image";

const idToType = ({id}) => id.split("@")[0];

const idToPath = ({id}) => replace("/", path.sep, id.split("@")[1]); // TODO make it split by first @ only

const pathToIdPart = ({p}) => replace(path.sep, "/", p);

const urlToPath = ({url}) => {
  if (url.length === 0) { return {p: ""}}
  if (url[0] === "/") {
    url = url.substr(1);
  }
  return replace("/", path.sep, url);
};

const addPostfixToPath = ({originalPath, postfix}) => {
  const fileExtension = path.extname(originalPath);
  const fileName = path.basename(originalPath, fileExtension);

  const outFileName = `${fileName}${postfix}${fileExtension}`;
  return path.join(originalPath, "..", outFileName);
};

const isPathImage = ({p}) => IMAGE_EXTENSIONS.filter(ie => path.extname(p) === `.${ie}`).length > 0;

const extractDimensionFromPath = ({p}) => {
  const fileExtension = path.extname(p);
  const fileName = path.basename(p, fileExtension);
  const dimension = fileName.split("-").pop();

  const originalPath = path.join(fileName, "..", `${fileName.join("-")}${fileExtension}`);
  return {dimension, originalPath};
};

const addDimensionsToPath = ({originalPath, dimension, ext}) => {
  const fileExtension = path.extname(originalPath);
  const fileName = path.basename(originalPath, fileExtension);

  const outFileName = `${fileName}-${dimension}${ext ? `.${ext}` : fileExtension}`;
  return path.join(originalPath, "..", outFileName);
};

export {idToType, idToPath, pathToIdPart, urlToPath, addPostfixToPath,
  extractDimensionFromPath, addDimensionsToPath, isPathImage};
