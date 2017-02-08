import path from "path";
import {contentPath} from "../index";
import {addDimensionsToPath, idToPath, pathToIdPart} from "../utils/id";
import {compress, meta} from "../utils/image";
import {chokidar$} from "../utils/chokidar";
const imageFormats = ["webp", null]; // null stands for "original"
const widths = [500, 1000, 1500, 2000];

const watcher$ = ({id}) => chokidar$(path.join(contentPath, idToPath({id})), {ignoreInitial: true});
export const image = {
  childrenWatcher$: watcher$,
  children: async ({id}) => {
    const imagePath = idToPath({id});
    const imageMeta = await meta({src: path.join(contentPath, imagePath)});
    const {format, width} = imageMeta;

    return widths
      .filter(w => w < width)
      .reduce((acc, w) => (
        [...acc, ...imageFormats.map(f => ({width: w, format: f || format}))]
      ), [])
      .map(({width, format}) => {
        const scaledImagePath = addDimensionsToPath({originalPath: imagePath, dimension: width, ext: format});
        const p = pathToIdPart({p: scaledImagePath});
        return `scaledImage@${p}`;
      });
  },

  content: async ({id}) => {
    const p = path.join(contentPath, idToPath({id}));
    const [m, compressedImageAsBuffer] = await Promise.all([meta({src: p}), compress({src: p})]);
    return {
      meta: m,
      content: compressedImageAsBuffer
    }
  },
  contentWatcher$: watcher$
};


