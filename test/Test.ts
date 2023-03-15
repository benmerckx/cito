import {test} from 'uvu'
import * as assert from 'uvu/assert'
import * as type from '../src/index.js'

type Expr = typeof Expr.union.infer
namespace Expr {
  class none {
    type = type.literal('none')
  }
  class unop {
    type = type.literal('unop')
    expr = union
  }
  class binop {
    type = type.literal('binop')
    left = union
    right = union
  }
  export const union = type.union(none, unop, binop)
  export const None = (): Expr => ({type: 'none'})
  export const UnOp = (expr: Expr): Expr => ({type: 'unop', expr})
  export const BinOp = (left: Expr, right: Expr): Expr => ({
    type: 'binop',
    left,
    right
  })
}

test('recursive adt', () => {
  const expr = Expr.union
  assert.ok(expr.check(Expr.None()))
  assert.ok(expr.check(Expr.UnOp(Expr.None())))
  assert.ok(expr.check(Expr.BinOp(Expr.None(), Expr.None())))
  assert.not.ok(expr.check(Expr.BinOp(Expr.None(), 123 as any)))
})

test('primitives', () => {
  assert.ok(type.string.check('hello'))
  assert.not.ok(type.string.check(123))
  assert.ok(type.compile(type.string).check('hello'))
  assert.not.ok(type.compile(type.string).check(123))
  assert.ok(type.number.check(123))
  assert.not.ok(type.number.check('hello'))
  assert.ok(type.compile(type.number).check(123))
  assert.not.ok(type.compile(type.number).check('hello'))
  assert.ok(type.boolean.check(true))
  assert.not.ok(type.boolean.check('hello'))
  assert.ok(type.compile(type.boolean).check(true))
  assert.not.ok(type.compile(type.boolean).check('hello'))
  assert.ok(type.symbol.check(Symbol('hello')))
  assert.not.ok(type.symbol.check('hello'))
  assert.ok(type.compile(type.symbol).check(Symbol('hello')))
  assert.not.ok(type.compile(type.symbol).check('hello'))
  assert.ok(type.bigint.check(BigInt(123)))
  assert.not.ok(type.bigint.check('hello'))
  assert.ok(type.compile(type.bigint).check(BigInt(123)))
  assert.not.ok(type.compile(type.bigint).check('hello'))
})

test('dates', () => {
  assert.ok(type.date.check(new Date()))
  assert.not.ok(type.date.check('hello'))
  assert.ok(type.compile(type.date).check(new Date()))
  assert.not.ok(type.compile(type.date).check('hello'))
})

test('arrays', () => {
  const str = type.array(type.string)
  assert.not.ok(str.check('hello'))
  assert.ok(str.check(['hello', 'world']))
  assert.not.ok(str.check(['hello', 123]))
  const strJit = type.compile(str)
  assert.not.ok(strJit.check('hello'))
  assert.ok(strJit.check(['hello', 'world']))
  assert.not.ok(strJit.check(['hello', 123]))
  const nr = type.array(type.number)
  assert.ok(nr.check([123, 456]))
  assert.not.ok(nr.check([123, 'hello']))
  const nrJit = type.compile(nr)
  assert.ok(nrJit.check([123, 456]))
  assert.not.ok(nrJit.check([123, 'hello']))
})

test('records', () => {
  const str = type.record(type.string)
  assert.ok(str.check({hello: 'world'}))
  assert.not.ok(str.check({hello: 123}))
  const strJit = type.compile(str)
  assert.ok(strJit.check({hello: 'world'}))
  assert.not.ok(strJit.check({hello: 123}))
  const nr = type.record(type.number)
  assert.ok(nr.check({hello: 123}))
  assert.not.ok(nr.check({hello: 123, second: true}))
  const nrJit = type.compile(nr)
  assert.ok(nrJit.check({hello: 123}))
  assert.not.ok(nrJit.check({hello: 123, second: true}))
})

test('objects', () => {
  const obj = type.object({
    hello: type.string,
    world: type.number
  })
  assert.ok(obj.check({hello: 'world', world: 123}))
  assert.not.ok(obj.check({hello: 'world', world: 'hello'}))
  const objJit = type.compile(obj)
  assert.ok(objJit.check({hello: 'world', world: 123}))
  assert.not.ok(objJit.check({hello: 'world', world: 'hello'}))
})

test('unions', () => {
  assert.ok(type.union(type.string, type.number).check('hello'))
  assert.ok(type.union(type.string, type.number).check(123))
  assert.not.ok(type.union(type.string, type.number).check(true))
  assert.ok(type.compile(type.union(type.string, type.number)).check('hello'))
  assert.ok(type.compile(type.union(type.string, type.number)).check(123))
  assert.not.ok(type.compile(type.union(type.string, type.number)).check(true))
})

test('enums', () => {
  assert.ok(type.enums({hello: 'world'}).check('hello'))
  assert.not.ok(type.enums({hello: 'world'}).check('world'))
  assert.ok(type.compile(type.enums({hello: 'world'})).check('hello'))
  assert.not.ok(type.compile(type.enums({hello: 'world'})).check('world'))
})

test('path', () => {
  const obj = type.object({
    sub: type.array(
      type.object({
        inner: type.string
      })
    )
  })

  assert.throws(() => {
    type.assert({sub: [{inner: 123}]}, obj)
  }, 'Expected string @ sub[0].inner')
})

test('nullable', () => {
  assert.ok(type.string.nullable.check(null))
  assert.ok(type.nullable(type.string).check('hello'))
  assert.not.ok(type.nullable(type.string).check(123))
})

test('optional', () => {
  assert.ok(type.string.optional.check(undefined))
  assert.ok(type.optional(type.string).check('hello'))
  assert.not.ok(type.optional(type.string).check(123))
})

test('literal', () => {
  assert.ok(type.literal('hello').check('hello'))
  assert.not.ok(type.literal('hello').check('world'))
  assert.ok(type.literal(123).check(123))
  assert.not.ok(type.literal(123).check(456))
  assert.ok(type.literal(true).check(true))
  assert.not.ok(type.literal(true).check(false))
})

test('tuples', () => {
  const tuple = type.tuple(type.string, type.number)
  assert.ok(tuple.check(['hello', 123]))
  assert.not.ok(tuple.check(['hello', 'world']))
  const tupleJit = type.compile(tuple)
  assert.ok(tupleJit.check(['hello', 123]))
  assert.not.ok(tupleJit.check(['hello', 'world']))
})

test('recursive', () => {
  type Node = typeof Node.infer
  const Node = type.object(
    class Node {
      next = type.object(Node).optional
      prev = type.object(Node).optional
      data = type.string
    }
  )
  assert.ok(Node.check({data: 'hello'}))
  assert.ok(Node.check({data: 'hello', next: {data: 'world'}}))
  assert.not.ok(Node.check({data: 'hello', next: {data: 123}}))
  const List = type.object({
    head: Node.optional
  })
  assert.ok(List.check({}))
  assert.ok(List.check({head: {data: 'hello'}}))
  assert.not.ok(List.check({head: {data: 123}}))
})

test('custom type', () => {
  const regex = type.type(
    (value): value is RegExp => value instanceof RegExp,
    path => `${path} instanceof RegExp`
  )

  regex(/(.*?)/g)
  assert.throws(() => regex('this will throw'))

  const regexJit = type.compile(regex)
  assert.ok(regexJit.check(/(.*?)/g))
  assert.not.ok(regexJit.check('this will throw'))
})

test.run()
