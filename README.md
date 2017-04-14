[![NPM version](https://img.shields.io/npm/v/estel.svg)](https://www.npmjs.com/package/estel)
[![Build Status](https://travis-ci.org/smelukov/estel.svg?branch=master)](https://travis-ci.org/smelukov/estel)
[![Coverage Status](https://coveralls.io/repos/github/smelukov/estel/badge.svg?branch=master)](https://coveralls.io/github/smelukov/estel?branch=master)

**Estel** is [EStree](https://github.com/estree/estree) AST interpreter with dynamic analyzing.

## Install

```
> npm install estel
```

## Usage

```js
let estel = require('estel');
let parser = require('esprima');

let scope = new estel.Scope();
let ast = parser.parse(`
    let number = 10;
    let obj = {
        someProp: number,
        fn(a, b) {
          return this.someProp + a + b;
        }
    };
    let value = obj.fn(1, 2);
`);

estel.processNames(ast, scope);
estel.processValues(ast);

let numberRef = scope.getReference('number');
let valueRef = scope.getReference('value');

console.log(scope.getOwnReferenceNames()); // ['number', 'obj', 'value']
console.log(numberRef.value); // 10
console.log(valueRef.value); // 13
```

You can use any parser that generates AST in [EStree](https://github.com/estree/estree) format:
- [acorn](https://github.com/ternjs/acorn)
- [esprima](https://github.com/jquery/esprima)
- [espree](https://github.com/eslint/espree)

or anything else...

## Scopes

Scope - is a place where the variables is defined.

Estel supports `var`, `let` and `const` definition:

```js
let ast = parser.parse(`
    var someVar;
    let someLet;
    const someConst = 1;
    
    if(true) {
        var anotherVar;
        let anotherLet;
        const anotherConst = 2;
        function someFn() {}
    }
`);

estel.processNames(ast, scope);

let ifScope = scope.scopes[0];

console.log(scope.getOwnReferenceNames()); // ['someVar', 'someLet', 'someConst', 'anotherVar', 'someFn']
console.log(ifScope.getOwnReferenceNames()); // ['anotherLet', 'anotherConst']
```

## Objects

Estel supports object definition and manipulation with objects:

```js
let ast = parser.parse(`
    let obj = { prop1: { prop2: { prop3: 1 } } };
    let a = obj.prop1.prop2.prop3;
    
    delete obj.prop1.prop2.prop3;
    obj.prop1.prop2.prop4 = 10
    
    let b = obj.prop1.prop2.prop3;
    let c = obj.prop1.prop2.prop4;
`);

estel.processNames(ast, scope);
estel.processValues(ast);

console.log(scope.getReference('a').value); // 1
console.log(scope.getReference('b').value); // undefined
console.log(scope.getReference('c').value); // 10
```

## Operators

Estel supports basic ECMAScript [operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators):

```js
let ast = parser.parse(`
    let a = 0;
    a++; a++;
    let b = 0 || a;
    let c = a || 10;
    let d = a && 10;
`);

estel.processNames(ast, scope);
estel.processValues(ast);

console.log(scope.getReference('a').value); // 2
console.log(scope.getReference('b').value); // 2
console.log(scope.getReference('c').value); // 2
console.log(scope.getReference('d').value); // 10
```

## Functions

```js
let ast = parser.parse(`
    function fn(a, b) {
        return a + b;
    }
    
    var result = fn(1, 2);
`);

estel.processNames(ast, scope);
estel.processValues(ast);

console.log(scope.getReference('result').value); // 3
```

### Arguments

Estel supports `arguments` variable inside a function:

```js
let ast = parser.parse(`
    function fn(a, b) {
        return arguments[0] + arguments[1];
    }
    
    var result = fn(1, 2);
`);

estel.processNames(ast, scope);
estel.processValues(ast);

console.log(scope.getReference('result').value); // 3
```

### this

Estel supports resolving of `this` keyword in simple cases:

```js
let ast = parser.parse(`
    function fn(a, b) {
        return this.someProp + a + b;
    }
    let obj1 = { someProp: 10, fn };
    let obj2 = { someProp: 20, fn };
    let result1 = obj1.fn(1, 2);
    let result2 = obj2.fn(3, 4);
`);

estel.processNames(ast, scope);
estel.processValues(ast);

console.log(scope.getReference('result1').value); // 13
console.log(scope.getReference('result2').value); // 27
```

### Closure

Estel supports scope closure:

```js
let ast = parser.parse(`
    function fn(a) {
        return function() { return ++a };
    }
    let counter = fn(1);
    let result1 = counter();
    let result2 = counter();
`);

estel.processNames(ast, scope);
estel.processValues(ast);

console.log(scope.getReference('result1').value); // 2
console.log(scope.getReference('result2').value); // 3
```

### Arrow function

Estel supports arrow functions (no own `this` and `arguments`):

```js
let ast = parser.parse(`
    function fn(a, b) {
        return () => this.someProp + arguments[0] + arguments[1];
    }
    let obj1 = { someProp: 10, fn };
    let obj2 = { someProp: 20, fn };
    let wrapper1 = obj1.fn(1, 2);
    let wrapper2 = obj2.fn(3, 4);
    let result1 = wrapper1();
    let result2 = wrapper2();
`);

estel.processNames(ast, scope);
estel.processValues(ast);

console.log(scope.getReference('result1').value); // 13
console.log(scope.getReference('result2').value); // 27
```
