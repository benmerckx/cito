# cito

Check types at runtime (<1kb)

- Small: 1/4 of superstruct, 1/15 of zod
- Support recursive type declarations
- Descriptive error messages
- Full TypeScript support

```sh
npm install cito
```

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
const literal: <T>(value: T) => Type<T>
const nullable: <T>(inner: Type<T>) => Type<T | null>
const optional: <T>(inner: Type<T>) => Type<T | undefined>
const instance: <T>(constructor: new (...args: any[]) => T) => Type<T>
const tuple: <T>(...types: T) => Type<Tuple<T>>
const record: <T>(inner: Type<T>) => Type<Record<string, T>>
const object: <T>(definition: T) => Type<Object<T>>
const union: <T>(...types: T) => Type<Union<T>>
const array: <T>(inner: Type<T>) => Type<Array<T>>
const enums: <T>(types: T) => Type<keyof T>
const lazy: <T>(fn: () => Type<T>) => Type<T>
const assert: <T>(value: unknown, type: Type<T>): asserts value is T
const is: <T>(value: unknown, type: Type<T>): value is T
```
