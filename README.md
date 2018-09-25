# babel-plugin-universal-css-prop

[![Build Status](https://travis-ci.org/giuseppeg/babel-plugin-universal-css-prop.svg?branch=master)](https://travis-ci.org/giuseppeg/babel-plugin-universal-css-prop)

Converts the `css` prop to a function call inside of `className`.

```js
<div css={{ color: 'red' }} />
```

💫

```js
import _cssProp from 'css-in-js-lib'

<div className={_cssProp({ color: 'red' })} />
```

The `_cssProp` function must return a `string`.

## Installation

```
npm i --save-dev babel-plugin-universal-css-prop
```

Then add the plugin to your `.babelrc` file:

```JSON
{
  "plugins": [
    "@babel/plugin-syntax-jsx",
    ["babel-plugin-universal-css-prop", { "packageName": "css-in-js-lib" }]
  ]
}
```

You must define a mandatory `packageName` option that is the CSS in JS library that exposes the css function that is called with the `css` prop expression (content).

If the function you want to use is not the default package export you can use the `importName` option:

```JSON
{
  "plugins": [
    ["babel-plugin-universal-css-prop", {
      "packageName": "emotion",
      "importName": "css"
    }]
  ]
}
```
