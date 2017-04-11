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
let resolver = require('estel').valueResolver;
let parser = require('estel').parser;

let scope = new Scope();
let ast = parser.parse(`
    var number = 10;
    var obj = { prop1: 1, prop2: { prop3: 2, prop4: 3 } };
    var value = obj.prop2.prop4;
    
    if(1) { var soveVar; let someLet; }
    function Fn(param1, param2) { var someOtherVar = 20 }`);

processNames(ast, scope);

console.log(scope.getOwnReferenceNames()); // ['number', 'obj', 'value', 'soveVar, 'Fn']
console.log(scope.scopes[0].getOwnReferenceNames()); // ['someLet']
console.log(scope.scopes[1].getOwnReferenceNames()); // ['arguments', 'param1', 'param2', 'someOtherVar']

processValues(ast);

let numberToken = scope.getReference('number').token;
let valueToken = scope.getReference('value').token;

console.log(numberToken.value); // 10
console.log(resolver.resolveToken(valueToken)); // { resolved: true, value: 3 }
```
