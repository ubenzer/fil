import ReactDOMServer from 'react-dom/server';
import path from "path";
import React from "react";

const chunk = ({array, chunkSize}) => {
  const tbReturned = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    tbReturned.push(array.slice(i, i + chunkSize));
  }
  return tbReturned;
};

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
  async handle({utils, project, url}) {
    const pageNumber = +(url.substr(1) || 1) - 1;
    const posts = (await project.metaOf({id: "posts"})).children;
    const postsInPage = calculatePagination({posts})[pageNumber];

    const postContents = await Promise.all(postsInPage.ids.map(id => project.valueOf({id}).then(value => ({value, id}))));

    const content = postContents.reduce((acc, {value, id}) => acc + "ÜÜÜ" + value + "ÄÄÄ"  + id, "");

    return {
      headers: [],
      body: content
    }
  }
};
export {recentPostsCollectionHandler};
