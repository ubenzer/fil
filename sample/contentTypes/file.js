import path from "path";
import {contentPath} from "../index";
import {fsPromise} from "../../app/utils";
import {idToPath} from "../utils/id";
import {chokidar$} from "../utils/chokidar";

export const file = {
  content: async ({id}) => {
    const p = idToPath({id});
    const content = await fsPromise.readFileAsync(path.join(contentPath, p));
    return {content};
  },
  contentWatcher$: ({id}) => chokidar$(path.join(contentPath, idToPath({id})), {ignoreInitial: true})
};
