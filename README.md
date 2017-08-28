# Fil

[![Gitter](https://img.shields.io/gitter/room/ubenzer/fil.svg?maxAge=2592000&style=flat-square)](https://gitter.im/ubenzer/fil) [![Travis](https://img.shields.io/travis/ubenzer/fil.svg?maxAge=3600&style=flat-square)](https://travis-ci.org/ubenzer/fil)
[![David](https://img.shields.io/david/ubenzer/fil.svg?maxAge=3600&style=flat-square)](https://david-dm.org/ubenzer/fil)
[![David](https://img.shields.io/david/dev/ubenzer/fil.svg?maxAge=3600&style=flat-square)](https://david-dm.org/ubenzer/fil#info=devDependencies)
[![Codecov](https://img.shields.io/codecov/c/github/ubenzer/fil.svg?maxAge=3600&style=flat-square)](https://codecov.io/gh/ubenzer/fil)
[![npm](https://img.shields.io/npm/v/fil.svg?maxAge=3600&style=flat-square)](https://www.npmjs.com/package/fil)
[![npm](https://img.shields.io/npm/dt/fil.svg?maxAge=3600&style=flat-square)](https://www.npmjs.com/package/fil)

Fil is a static content engine that can be used to host no-so-dynamic web sites such as blogs, technical documents,
internal company tech wikies and content management systems.

## Demo and Samples

1. This blog can be used as a **clone-to-start** for your own blog. [[Repo](https://github.com/ubenzer/fil-blog) | [Demo](https://fil.ubenzer.com/)]
2. This is my real blog that uses Fil under the hood and hosted via Github Pages. [[Click to Go](https://ubenzer.com/)]

## Features of Fil

1. Super fast!
2. **No assumptions made.** We think everyone's content organization is different. So we only provide basics.

### What do you mean with no assumptions, only basics?
Fil provides a way to define 'content type's that represents **any kind of data** from **any kind of source** with any kind of **validity rule** in **any kind of hierarchy** of __your__ decision.

Fil also provides a way to define outputs. Each output is accessed by a url of your choice.

Fil manages them and their life cycle. Therefore you can **instantly see** a preview of your new content while editing it, and still be able to generate whole web page in one go to deploy it as a **static website** to your production.

## Get started with a new fil project
**Please check that your system conforms [requirements](#requirements).**

Now you have two choices. You can start by cloning an starter template such as [fil-blog](https://github.com/ubenzer/fil-blog). This ensures that basics are set up and you can start modifying it for your needs. **We recommend to go this way, until a better way is introduced.**

If you want to start over, read [API](#api) docs and use it as you wish. :-)

You can also install `fil` is a global package via `npm i -g fil` and use it that way. See all parameters [here](#fil-executable).

## Requirements
1. Node.js 8.2.x+
2. npm 5.x

## Architecture & Overview
A `fil` website has two parts:

1. **The compiler:** It is the `fil` package you installed via npm. Normally, you use it as is, if you are not developing a feature to library itself. Compiler is responsible for:

      a. Read project config.

      b. Managing content lifecycle. Accounting.

      c. Providing a http server dynamic mode, refreshing pages on content change.

      d. Generating static website for production.

      e. Caching of contents for speedy recompilations.

2. **The project:** This is your website project. It contains whole files that is related with your website. Usually this contains the following:

    a. **`index.js`:** Entrypoint to your project: A file that tells `fil` everything that is required to build the project.

    b. **Content Types:** Skeletons that defines how to find, watch and organize your contents. Metadata of contents.

    c. **Contents:** Actual contents that fits a Content Type description. Everything that is used in website including **templates, frontend javascript, css, static image files, posts etc. are ALL contents**. Contents doesn't generate output.

    d. **Routes:** Provide a list of URLs that they'll handle based on the contents available. **Routes are the only thing that are responsible to generate output.**

You can have unlimited amount of different content types, contents and routes. It is up to you.

## API & Project Definition
You can find required information and interfaces to create your own Fil project in [PROJECT.md](PROJECT.md).

If you want to use Fil programmatically, you can find API definition in API.md in the future.

## Roadmap 
The following features are planned considered. Not in particular order. And no promises.
1. Graceful 404 and 500 pages in dynamic mode.
2. Finding urls that points to non existent things in the output.
3. Tests.

## Contributing
No defined way of contributing yet. Just go wild. %-) If you are planning to add a new feature, open a PR and let's discuss it first.

## Setting up development environment
To setup your development environment, first please check you have the things described in [requirements](#requirements) section are met.

Clone latest master to your local box:
`git clone git@github.com:ubenzer/fil.git`

Run `npm i` to install dependencies.

Use  `index-babel.js` as entry point, which transpiles ES6 tp ES5, so you don't suffer while developing.

e.g.

```sh
# Let's say...
# Your development fil is in fil folder
# Your sample website that you test your changes is in my-fil-website folder

cd my-fil-website
../fil/app/bin/index-babel.js --dynamic --nocache --force
```

## Fil Executable

`fil` Compiles your website into static pages to host them for production use. 

`fil --dynamic` Starts a development server with change detection and auto reloading features to enable users to add/change content and instantly see the results. **Do not use dynamic mode to host production websites.**

Static and dynamic rendering generates the same output. Static rendering is optimized for speed and production use. Dynamic rendering is optimized for early feedback and development use.

`fil --force` Normally you can't start more than one `fil` instances for the same fil project. You can use the force to skip this limitation. Be warned though, cache might go crazy!

`fil --headers` Normally on static mode HTTP headers are not generated. If you pass this parameter, fil will generate a `.headers` file for each generated file which contains HTTP headers generated for that page. You can configure your production server to use header information in this files. This has no effect on `—dynamic` mode.

`fil --nocache` Normally fil projects are cached for speedy incremental builds. By using this option you can skip cache for one time.

## Alternatives

Fil is a project work in progress and no commitments made at this point. If you need a more mature project, you can check [Jekyll](https://jekyllrb.com/) (ruby), [Hexo](https://hexo.io) (js) or [Hugo](https://gohugo.io/)(go).

### Why you should prefer Fil?

1. You want to control every single line generated for your website.
2. You have a unique content organisation and none of the out of the box solutions that other static site generators offer doesn't fit you nicely and you need to tinker them by plugins etc. hoping that it work.
3. You want to use your companies proprietary template engine or data store.
4. You want to try something new. 

### Why you should not prefer Fil?

1. Fil is not mature and there is no community contribution (yet). Therefore you should accept there there will be situations that you should 'dive into the project' and figure out/fix yourself.
2. Fil doesn't have much samples and starter projects.
3. You don't need much of a customization and your content structure fits nicely to one of other static site generators that provides out of the box solutions.
