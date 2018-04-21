# [<img src="logo.png" alt="quark-log" width="200">](https://github.com/fm-ph/quark-log)

[![build status][travis-image]][travis-url]
[![stability][stability-image]][stability-url]
[![npm version][npm-image]][npm-url]
[![js-standard-style][standard-image]][standard-url]
[![semantic-release][semantic-release-image]][semantic-release-url]

Simple router.

___This package is part of `quark` framework but it can be used independently.___

## Installation

[![NPM](https://nodei.co/npm/quark-router.png)](https://www.npmjs.com/package/quark-router)

```sh
npm install quark-router --save
```

## Usage

### Basic

```js
import Router from 'quark-router'

const routes = [{
  name: 'home',
  callback: route => { },
  path: '/'
}]
const router = new Router({ routes })
```

_To be written..._

## API

See [https://fm-ph.github.io/quark-router/](https://fm-ph.github.io/quark-router/)

## Build

To build the sources with `babel` in `./lib` directory :

```sh
npm run build
```

## Documentation

To generate the `JSDoc` :

```sh
npm run docs
```

To generate the documentation and deploy on `gh-pages` branch :

```sh
npm run docs:deploy
```

## Testing

To run the tests, first clone the repository and install its dependencies :

```sh
git clone https://github.com/fm_ph/quark-router.git
cd quark-router
npm install
```

Then, run the tests :

```sh
npm test
```

To watch (test-driven development) :

```sh
npm run test:watch
```

For coverage :

```sh
npm run test:coverage
```

## License

MIT [License](LICENSE.md) © [Patrick Heng](http://hengpatrick.fr/) [Fabien Motte](http://fabienmotte.com/) 

[travis-image]: https://img.shields.io/travis/fm-ph/quark-router/master.svg?style=flat-square
[travis-url]: http://travis-ci.org/fm-ph/quark-router
[stability-image]: https://img.shields.io/badge/stability-stable-brightgreen.svg?style=flat-square
[stability-url]: https://nodejs.org/api/documentation.html#documentation_stability_index
[npm-image]: https://img.shields.io/npm/v/quark-router.svg?style=flat-square
[npm-url]: https://npmjs.org/package/quark-router
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release
