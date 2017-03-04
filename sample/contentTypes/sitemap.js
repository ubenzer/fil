import {urlForPost, urlForPostAttachment} from "../utils/url"
import {baseUrl} from "../config"
import {idToType} from "../utils/id"
import moment from "moment/moment"
import sitemap from "sitemap"

const generateSitemap = ({posts}) => {
  const twoWeeksAgo = moment().subtract(15, "days")
  const urls = posts.map((post) => {
    const isContentOld = moment(post.editDate).isBefore(twoWeeksAgo)
    const imagesOfContent = post.postImageIds.map((imageId) => `${baseUrl}${urlForPostAttachment({id: imageId})}`)

    return {
      changefreq: isContentOld ? "monthly" : "weekly",
      img: imagesOfContent,
      lastmodISO: post.editDate.toISOString(),
      priority: isContentOld ? 0.6 : 0.8,
      url: `${baseUrl}${urlForPost({id: post.id})}`
    }
  })
  const sitemapSkeleton = {urls}
  const sm = sitemap.createSitemap(sitemapSkeleton)
  return sm.toString()
}

const sitemp = {
  content: async ({posts}) => {
    const map = generateSitemap({posts})
    return {content: map}
  },
  contentArguments: async ({project}) => {
    const {children: postIds} = await project.metaOf({id: "postCollection"})
    const posts = await Promise.all(
      postIds.map((p) => Promise.all([
        project.valueOf({id: p}),
        project.metaOf({id: p})
      ])
      .then(([postContent, postMeta]) => {
        const postImageIds = postMeta.children.filter((c) => idToType({id: c}) === "image")
        return {postContent, postImageIds}
      })
      .then(({postContent, postImageIds}) => ({
        editDate: postContent.editDate,
        id: p,
        postImageIds
      }))
    ))

    return {posts}
  }
}

export {sitemp as sitemap}
