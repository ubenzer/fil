cd  ~/Playground/node-es6/sample
export DEBUG="fil:*" && export VIPS_WARNING="" && ../node_modules/babel-cli/bin/babel-node.js --harmony-async-await ../app/bin/index.js --dynamic

cd  ~/Playground/node-es6/sample
../node_modules/.bin/nodemon --watch /Users/ub/Playground/node-es6 --exec /Users/ub/Playground/node-es6/node_modules/.bin/babel-node --inspect --debug-brk /Users/ub/Playground/node-es6/app/bin/index.js
