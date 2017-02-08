import {addPostfixToPath, idToPath, idToType, isPathImage, urlToPath} from "../utils/id";
import * as path from "path";
import {defaultHeadersFor} from "../utils/http";
import {postSubfolder} from "../index";

const scaledImagePostfix = ".scaled";

const binaryPassthroughHandler = {
  async handlesArguments({project}) {
    const posts = await project.metaOf({id: "posts"});
    const arrayOfChildMeta = await Promise.all(posts.children.map(post => project.metaOf({id: post})));
    const postChildrenIds = arrayOfChildMeta.reduce((acc, meta) => [...acc, ...(meta.children)], []);

    const postImageIds = postChildrenIds.filter(pci => idToType({id: pci}) === "image");
    const arrayOfScaledImageMeta = await Promise.all(postImageIds.map(c => project.metaOf({id: c})));
    const scaledImageIds = arrayOfScaledImageMeta.reduce((acc, meta) => [...acc, ...(meta.children)], []);

    return {
      attachmentIds: postChildrenIds,
      scaledImageIds: scaledImageIds
    };
  },
  async handles({attachmentIds, scaledImageIds}) {
    const attachmentUrls = attachmentIds.map(id => idToPath({id}));
    const scaledImageUrls = scaledImageIds.map(id => {
      const p = idToPath({id});
      return addPostfixToPath({originalPath: p, postfix: scaledImagePostfix});
    });
    // we get rid of post part of id (--->post<---/2010/05/finaller/finaller-500.scaled.webp)
    return [...attachmentUrls, ...scaledImageUrls].map(url => url.substr(postSubfolder.length));
  },
  async handle({project, url}) {
    const p = urlToPath({url});
    const ext = path.extname(p);
    const isImage = isPathImage({p});
    const isScaledImage = p.endsWith(`${scaledImagePostfix}${ext}`);
    const type = isImage ? (isScaledImage ? "scaledImage" : "image") : "file";
    const value = await project.valueOf({id: `${type}@${postSubfolder}/${p}`});

    return {
      headers: defaultHeadersFor({url}),
      body: value.content
    }
  }
};
export {binaryPassthroughHandler};
