import replace from "replaceall";
import path from "path";
import {IMAGE_EXTENSIONS} from "./image";

const scaledImagePostfix = ".scaled";

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

const isPathImage = ({p}) => IMAGE_EXTENSIONS.filter(ie => path.extname(p) === `.${ie}`).length > 0;

const isGeneratedImagePath = ({p}) => {
  try {
    const {dimension, originalPath, ext} = fromGeneratedImagePath({p});
    return !!(originalPath && dimension && ext);
  } catch (e) {
    return false;
  }
};

const fromGeneratedImagePath = ({p}) => {
  const fileExtension = path.extname(p);
  const fileName = path.basename(p, fileExtension);
  const fileNamePieces = fileName.split(scaledImagePostfix);
  if (fileNamePieces.length < 2) { return null; }

  const afterScaledImagePostFix = fileNamePieces.pop();
  const [, ext, dimensionStr] = afterScaledImagePostFix.split("-");
  const dimension = parseInt(dimensionStr);

  const originalPath = path.join(p, "..", `${fileNamePieces.join(scaledImagePostfix)}.${ext}`);
  return {dimension, originalPath, ext};
};

const toGeneratedImagePath = ({originalPath, dimension, ext}) => {
  const fileExtension = path.extname(originalPath);
  const fileName = path.basename(originalPath, fileExtension);
  const normalizedExtension = ext ? `.${ext}` : fileExtension;

  /// a/b/c.jpg becomes a/b/c.scaled-jpg-500.webp
  const outFileName = `${fileName}${scaledImagePostfix}-${fileExtension.substr(1)}-${dimension}${normalizedExtension}`;
  return path.join(originalPath, "..", outFileName);
};

export {idToType, idToPath, pathToIdPart, urlToPath, isGeneratedImagePath,
  fromGeneratedImagePath, toGeneratedImagePath, isPathImage};
