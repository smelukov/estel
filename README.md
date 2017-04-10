[![NPM version](https://img.shields.io/npm/v/estel.svg)](https://www.npmjs.com/package/estel)
[![Build Status](https://travis-ci.org/smelukov/estel.svg?branch=master)](https://travis-ci.org/smelukov/estel)
[![Coverage Status](https://coveralls.io/repos/github/smelukov/estel/badge.svg?branch=master)](https://coveralls.io/github/smelukov/estel?branch=master)

**Estel** is [EStree](https://github.com/estree/estree) AST processor

## Install

```
> npm install estel
```

## Usage

```js
let Scope = require('estel').Scope;
let processNames = require('estel').processNames;
let processValues = require('estel').processValues;
let parser = require('estel').parser;

let scope = new Scope();
let ast = parser.parse(`
    var a = 10;
    if(1) { var c; let d; }
    function Fn(param1, param2) { var b = 20 }`);

processNames(ast, scope);

console.log(scope.getOwnReferenceNames()); // ['a', 'c', 'Fn']
console.log(scope.scopes[0].getOwnReferenceNames()); // ['d']
console.log(scope.scopes[1].getOwnReferenceNames()); // ['arguments', 'param1', 'param2', 'b']

processValues(ast);

console.log(scope.getReference('a').token.value); // 10
```
