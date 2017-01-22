import Rx from 'rxjs/Rx';
import PostCollection from "../contentTypes/postCollection";
import Template from "../template/template";
import ReactDOMServer from 'react-dom/server';

export class SinglePostRouteHandler {
  async handles() {
    return (await PostCollection.contents()).map(c => `/${c.id()}`);
  }

  async handle(route) {
    const id = route.substr(1);
    return Rx.Observable.fromPromise(PostCollection.contents())
      .flatMap(posts => posts)
      .filter(p => p.id() === id)
      .take(1)
      .flatMap(post => post.content())
      .map(text => {
        const attrs = {
          content: text
        };
        const str = ReactDOMServer.renderToStaticMarkup(<Template {...attrs} />);
        return {
          headers: [],
          body: str
        }
      })
      .toPromise();
  }
}
export default new SinglePostRouteHandler();
