import path from "path";
import {fromGeneratedImagePath, idToPath, pathToIdPart} from "../utils/id";
import {resizeByWidth} from "../utils/image";
import {contentPath} from "../index";

export const scaledImage = {
  contentArguments: async ({id, project}) => {
    const p = idToPath({id});
    const {dimension, originalPath} = fromGeneratedImagePath({p});
    const sourceId = `image@${pathToIdPart({p: originalPath})}`;

    const originalImage = await project.valueOf({id: sourceId});
    return {id: id, sourceId: sourceId, originalImage, width: dimension};
  },
  content: async ({id, originalImage, width}) => {
    const p = path.join(contentPath, idToPath({id}));
    const ext = path.extname(p).substr(1);
    const resizedImageAsBuffer = await resizeByWidth({src: originalImage.content, width, ext});

    return {
      content: resizedImageAsBuffer
    }
  }
};


