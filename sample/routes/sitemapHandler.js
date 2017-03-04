import {defaultHeadersFor} from "../utils/http"
import {urlForSitemap} from "../utils/url"

const sitemapHandler = {
  async handle({project, url}) {
    const value = await project.valueOf({id: "sitemap"})

    return {
      body: value.content,
      headers: defaultHeadersFor({url})
    }
  },
  handles: async () => [urlForSitemap()]
}
export {sitemapHandler}
