import {defaultHeadersFor} from "../utils/http";
import {chunk} from "../../app/utils";

const calculatePagination = ({posts}) => {
  const paginatedContentIds = chunk({array: posts, chunkSize: 10});
  return paginatedContentIds.map((ids, index, array) => {
    const isFirstPage = index === 0;
    const isLastPage = index === array.length - 1;
    const pageNumber = index + 1;
    return {ids, isFirstPage, isLastPage, pageNumber};
  });
};

const recentPostsCollectionHandler = {
  async handlesArguments({project}) {
    const posts = await project.metaOf({id: "posts"});
    return {
      posts: posts.children
    };
  },
  async handles({posts}) {
    const paginatedPostCollection = calculatePagination({posts});

    return paginatedPostCollection.map(({isFirstPage}, index) => `/${isFirstPage ? "" : index}`);
  },
  async handle({project, url}) {
    const pageNumber = +(url.substr(1) || 1) - 1;
    const posts = (await project.metaOf({id: "posts"})).children;
    const postsInPage = calculatePagination({posts})[pageNumber];

    const postContents = await Promise.all(postsInPage.ids.map(id => project.valueOf({id}).then(value => ({value, id}))));

    const content = postContents.reduce((acc, {value, id}) => acc + "ÜÜÜ" + value.htmlExcerpt + "ÄÄÄ"  + id, "");

    return {
      headers: defaultHeadersFor({url, defaultContentType: "text/html"}),
      body: content
    }
  }
};
export {recentPostsCollectionHandler};
