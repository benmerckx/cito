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
  assert.ok(expr.is(Expr.None()))
  assert.ok(expr.is(Expr.UnOp(Expr.None())))
  assert.ok(expr.is(Expr.BinOp(Expr.None(), Expr.None())))
  assert.not.ok(expr.is(Expr.BinOp(Expr.None(), 123 as any)))
})

test('primitives', () => {
  assert.ok(type.string.is('hello'))
  assert.not.ok(type.string.is(123))
  assert.ok(type.number.is(123))
  assert.not.ok(type.number.is('hello'))
  assert.ok(type.boolean.is(true))
  assert.not.ok(type.boolean.is('hello'))
  assert.ok(type.symbol.is(Symbol('hello')))
  assert.not.ok(type.symbol.is('hello'))
  assert.ok(type.bigint.is(BigInt(123)))
  assert.not.ok(type.bigint.is('hello'))
})

test('dates', () => {
  assert.ok(type.date.is(new Date()))
  assert.not.ok(type.date.is('hello'))
})

test('arrays', () => {
  assert.not.ok(type.array(type.string).is('hello'))
  assert.ok(type.array(type.string).is(['hello', 'world']))
  assert.not.ok(type.array(type.string).is(['hello', 123]))
  assert.ok(type.array(type.number).is([123, 456]))
  assert.not.ok(type.array(type.number).is([123, 'hello']))
})

test('records', () => {
  assert.ok(type.record(type.string).is({hello: 'world'}))
  assert.not.ok(type.record(type.string).is({hello: 123}))
  assert.ok(type.record(type.number).is({hello: 123}))
  assert.not.ok(type.record(type.number).is({hello: 123, second: true}))
})

test('objects', () => {
  assert.ok(
    type
      .object({
        hello: type.string,
        world: type.number
      })
      .is({hello: 'world', world: 123})
  )
  assert.not.ok(
    type
      .object({
        hello: type.string,
        world: type.number
      })
      .is({hello: 'world', world: 'hello'})
  )
})

test('unions', () => {
  assert.ok(type.union(type.string, type.number).is('hello'))
  assert.ok(type.union(type.string, type.number).is(123))
  assert.not.ok(type.union(type.string, type.number).is(true))
})

test('enums', () => {
  assert.ok(type.enums({hello: 'world'}).is('hello'))
  assert.not.ok(type.enums({hello: 'world'}).is('world'))
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
  assert.ok(type.string.nullable.is(null))
  assert.ok(type.nullable(type.string).is('hello'))
  assert.not.ok(type.nullable(type.string).is(123))
})

test('optional', () => {
  assert.ok(type.string.optional.is(undefined))
  assert.ok(type.optional(type.string).is('hello'))
  assert.not.ok(type.optional(type.string).is(123))
})

test('literal', () => {
  assert.ok(type.literal('hello').is('hello'))
  assert.not.ok(type.literal('hello').is('world'))
})

test('tuples', () => {
  const tuple = type.tuple(type.string, type.number)
  assert.ok(tuple.is(['hello', 123]))
  assert.not.ok(tuple.is(['hello', 'world']))
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
  assert.ok(Node.is({data: 'hello'}))
  assert.ok(Node.is({data: 'hello', next: {data: 'world'}}))
  assert.not.ok(Node.is({data: 'hello', next: {data: 123}}))
  const List = type.object({
    head: Node.optional
  })
  assert.ok(List.is({}))
  assert.ok(List.is({head: {data: 'hello'}}))
  assert.not.ok(List.is({head: {data: 123}}))
})

test.run()
