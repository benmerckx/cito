# cito

Check types at runtime

- Small (<1kb): 1/4 of superstruct, 1/15 of zod
- Support recursive type declarations
- Descriptive error messages
- Full TypeScript support

<pre>npm install <a href="https://www.npmjs.com/package/cito">cito</a></pre>

## Usage

```ts
import {assert, is, object, number, string, array} from 'cito'

type Post = typeof Post.infer
const Post = object({
  id: number,
  title: string,
  link: string.optional,
  author: object({id: number}),
  tags: array(string)
})

const data = {
  id: 42,
  title: 'Hello world',
  author: {id: 42},
  tags: ['hello']
}

// Throws if data is invalid, data is type as Post
assert(data, Post)

// data is typed as Post in the block, does not throw
if (is(data, Post)) {
  // use data
}

// Assert and name the input data
const post = Post(data)
```

## Recursive types

Object types can be declared using a class, which enables you to declare
recursive types with full type inference without having to resort manual type
definition.

```ts
import {any, object} from 'cito'
type Node = typeof Node.infer
const Node = object(
  class Node {
    next = object(Node)
    prev = object(Node)
    data = any
  }
)
type List = typeof List.infer
const List = object({
  head: Node.optional
})
```

## Api

Cito exports the following public members.

```ts
const string: Type<string>
const number: Type<number>
const bigint: Type<bigint>
const boolean: Type<boolean>
const symbol: Type<symbol>
const date: Type<Date>
const any: Type<any>
const func: Type<Function>
function literal<T>(value: T): Type<T>
function nullable<T>(inner: Type<T>): Type<T | null>
function optional<T>(inner: Type<T>): Type<T | undefined>
function instance<T>(constructor: new (...args: any[]) => T): Type<T>
function tuple<T>(...types: T): Type<Tuple<T>>
function record<T>(inner: Type<T>): Type<Record<string, T>>
function object<T>(definition: T): Type<Object<T>>
function union<T>(...types: T): Type<Union<T>>
function array<T>(inner: Type<T>): Type<Array<T>>
function enums<T>(types: T): Type<keyof T>
function lazy<T>(fn: () => Type<T>): Type<T>
function assert<T>(value: unknown, type: Type<T>): asserts value is T
function is<T>(value: unknown, type: Type<T>): value is T
```

A Type has the following api:

```ts
interface Validator<T> {
  (value: any): value is T
}

interface Type<T> {
  // This special property allows you to infer the type `T`
  infer: T

  // Call the instance to type check a value and return it if valid
  (value: any): T

  // A type that includes `T` and `null`
  nullable: Type<T | null>

  // A type that includes `T` and `undefined`
  optional: Type<T | undefined>

  // Returns a new type that narrows `T` to a subtype `E`
  narrow<E extends T>(): Type<E>

  // Create a new instance of type `T`, does not type check at runtime
  new (value: any): T

  // Returns a boolean indicating whether input is of type `T`
  is(input: any): input is T

  // Returns a new type which validates both `T` and `E`
  and<E>(validate: Validator<E>): Type<T & E>

  // Returns a new type which validates either `T` or `E`
  or<E>(validate: Validator<E>): Type<T | E>
}
```

Custom types can be created using the type function:

```ts
import {type} from 'cito'

const regex = type((value): value is RegExp => value instanceof RegExp)

regex(/(.*?)/g)
regex('this will throw')
```

## Benchmarks

Making the comparison with superstruct and zod:

> The benchmark code is adapted from [typed](https://github.com/brielov/typed/tree/master/benchmark), which is MIT License Copyright (c) 2022 CodBot

```ts
benchmark        time (avg)             (min … max)       p75       p99      p995
--------------------------------------------------- -----------------------------
zod           70.27 µs/iter      (57.7 µs … 776 µs)   66.7 µs  165.2 µs  190.7 µs
superstruct   263.4 µs/iter   (219.1 µs … 853.1 µs)  254.1 µs  524.6 µs  610.9 µs
cito          28.34 µs/iter    (26.2 µs … 313.8 µs)   28.1 µs   44.7 µs   61.9 µs

summary for validate
  cito
   2.48x faster than zod
   9.3x faster than superstruct
```

> _The data used in the benchmarks is from SpaceX's GraphQL API._
