# Fil

[![Gitter](https://img.shields.io/gitter/room/ubenzer/fil.svg?maxAge=2592000&style=flat-square)](https://gitter.im/ubenzer/fil)
[![Travis](https://img.shields.io/travis/ubenzer/fil.svg?maxAge=3600&style=flat-square)](https://travis-ci.org/ubenzer/fil)
[![David](https://img.shields.io/david/ubenzer/fil.svg?maxAge=3600&style=flat-square)](https://david-dm.org/ubenzer/fil)
[![David](https://img.shields.io/david/dev/ubenzer/fil.svg?maxAge=3600&style=flat-square)](https://david-dm.org/ubenzer/fil#info=devDependencies)
[![Codecov](https://img.shields.io/codecov/c/github/ubenzer/fil.svg?maxAge=3600&style=flat-square)](https://codecov.io/gh/ubenzer/fil)
[![npm](https://img.shields.io/npm/v/fil.svg?maxAge=3600&style=flat-square)](https://www.npmjs.com/package/fil)
[![npm](https://img.shields.io/npm/dt/fil.svg?maxAge=3600&style=flat-square)](https://www.npmjs.com/package/fil)

Fil is a static content engine that can be used to host no-so-dynamic web sites such as blogs, technical documents,
internal company tech wikies and content management systems.

## Features
1. Super fast!
2. No assumptions made. We think everyone's content organization is different. So we only provide basics.

### What do you mean with no assumptions, only basics?
Fil provides a way to define 'content type's that represents **any kind of data** from **any kind of source** with any kind of **validity rule** in **any kind of hierarchy**
 of __your__ decision.

Fil also provides way to define 'url's which supposed to generate some output using the contents that is a part of 'content type's mentioned above.

Fil manages them. Manages their life cycle. Therefore you can **instantly see** your new content while preparing it, and still be able to generate whole web page in one go to
 deploy it as a **static website** to your production.

## How get started with a new project
0. Please check that your system conforms [requirements](#requirements).
1. Install `fil` globally: `npm i -g fil`
2. At this point you installed `fil` successfully! Now you need a starter project, a basic template with sample
 content that demonstrates `fil`'s usage. However, we don't have it yet. :( Yeah that is stupid but that this
 is a work in progress. At some point, there will be a sample starter project which could be cloned. Meanwhile
 you should follow API documentation and create everything for scratch.
3. To see your website in dynamic mode for development purposes use `fil --dynamic`
4. To compile your website into static pages to host them for production use `fil`.
5. That is it, your website is built into `dist` folder! Do whatever you want with it. Push to Github Pages, s3 etc.

## Requirements
1. Node.js 7.8.0+
2. npm 3.x

## Architecture
A `fil` website has two parts:

1. The compiler: It is the `fil` package you installed via npm. Normally, you use it as is, if you are not developing
a feature to library itself. Compiler is responsible for:

    a. Read project config.
    b. Managing content lifecycle. Accounting.
    c. Providing a http server dynamic mode, refreshing pages on content change.
    d. Generating static website for production.
    e. Caching of contents for speedy recompilations.

2. The project: This is your website project. It contains whole files that is related with your website. Usually this contains the following:

    a. `index.js`: Entrypoint to your project: A file that tells `fil` everything that is required to build the project.

    b. Content Types: Skeletons that defines how to find, watch and organize your contents. Metadata of contents.

    c. Contents: Actual contents that fits a Content Type description. Everything that is used in website including **templates, frontend javascript,
    css, static image files, posts etc. are ALL contents**. Contents doesn't generate output.

    d. Routes: Provide a list of URLs that they'll handle based on the contents available. **Routes are the only thing that are responsible to generate output.**

You can have as much as and as different as Content Types, Contents and Routes as you want. It is up to you.

## ROADMAP
The following features are planned considered. Not in particular order. And no promises.
1. Graceful 404 and 500 pages in dynamic mode.
2. Finding urls that points to non existent things in the output.
3. Tests. :(

## Contributing
No defined way of contributing yet. Just go wild. %-) If you are planning to add a new feature, open a PR and let's
discuss it first.

## Setting up development environment
To setup your development environment, first please check you have the things described in
Requirements section are met.

Clone latest master to your local box:
`git clone git@github.com:ubenzer/fil.git`

Run `npm i` to install dependencies.

Run it using `babel-node` instead of `node` so it'll transpile everything into regular ES5.

e.g.

```sh
# Let's say...
# Your development fil is in fil folder
# Your sample website that you test your changes is in my-fil-website folder

cd my-fil-website
../fil/node_modules/.bin/babel-node ../fil/app/bin/index.js --dynamic --nocache --force
```

## Alternatives
Fil is a project work in progress and no commitments made at this point. If you need a more mature project, you can
check [Jekyll](https://jekyllrb.com/) (ruby), [Hexo](https://hexo.io) (js) or [Hugo](https://gohugo.io/)(go).
