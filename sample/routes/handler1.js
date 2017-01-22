import Rx from 'rxjs/Rx';
import Template from "../template/template";
import ReactDOMServer from 'react-dom/server';

export class ExperimentalHandler {
  async handlesArguments({project}) {
    return {
      posts: "/test"
    };
  }
  async handles({posts}) {
    return [posts, "sekonder"];
    // return (await posts.contents()).map(c => `/${c.id()}`);
  }

  async handle({url}) {
    const id = url.substr(1);
    return {
      headers: [],
      body: id + " yeah!"
    }
    // return Rx.Observable.fromPromise(posts)
    //   .flatMap(posts => posts)
    //   .filter(p => p.id() === id)
    //   .take(1)
    //   .flatMap(post => post.content())
    //   .map(text => {
    //     const attrs = {
    //       content: text
    //     };
    //     const str = ReactDOMServer.renderToStaticMarkup(<Template {...attrs} />);
    //     return {
    //       headers: [],
    //       body: str
    //     }
    //   })
    //   .toPromise();
  }

  // dispose()
}
const experimentalHandler = new ExperimentalHandler();
export default experimentalHandler;
