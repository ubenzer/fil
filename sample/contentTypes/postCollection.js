import path from "path";
import {postPath} from "../index";
import {getFoldersIn} from "../../app/utils";
import {chokidar$} from "../utils/chokidar";

export const postCollection = {
  childrenWatcher$: () => (
    chokidar$(postPath, {
      ignored: ["**/.*", "!**/"],
      ignoreInitial: true,
      depth: 3
    })
  ),
  children: async () => {
    const years = await getFoldersIn(postPath);
    const months = (await Promise.all(
      years.map(year =>
        getFoldersIn(path.join(postPath, year))
          .then(months => months.map(month => ({year, month})))
      )
    )).reduce((acc, monthArray) => [...acc, ...monthArray], []);

    const posts = (await Promise.all(
      months.map(({year, month}) =>
        getFoldersIn(path.join(postPath, year, month))
          .then(postIds => postIds.map(postId => ({year, month, postId})))
      )
    )).reduce((acc, postArray) => [...acc, ...postArray], []);

    return posts.map(({year, month, postId}) => `post@${year}/${month}/${postId}`);
  },
  content: async () => ({})
};
