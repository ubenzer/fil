import {chokidarAddRemoveFile$} from "../utils/chokidar"
import {getFoldersIn} from "../../app/utils/misc"
import path from "path"
import {postPath} from "../index"

export const postCollection = {
  children: async () => {
    const years = await getFoldersIn(postPath)
    const months = (await Promise.all(
      years.map((year) =>
        getFoldersIn(path.join(postPath, year))
          .then((mnts) => mnts.map((m) => ({month: m, year})))
      )
    )).reduce((acc, monthArray) => [...acc, ...monthArray], [])

    const posts = (await Promise.all(
      months.map(({year, month}) =>
        getFoldersIn(path.join(postPath, year, month))
          .then((postIds) => postIds.map((postId) => ({month, postId, year})))
      )
    )).reduce((acc, postArray) => [...acc, ...postArray], [])

    return posts.map(({year, month, postId}) => `post@/${year}/${month}/${postId}`)
  },
  childrenWatcher$: () =>
    chokidarAddRemoveFile$(`${postPath}/**/index.md`, {
      depth: 3,
      ignoreInitial: true
    }),
  content: async () => ({})
}
