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
  export const None = () => ({type: 'none'} as const)
  export const UnOp = (expr: Expr) => ({type: 'unop', expr})
  export const BinOp = (left: Expr, right: Expr) => ({
    type: 'binop',
    left,
    right
  })
}

test('recursive adt', () => {
  const expr = Expr.union
  assert.ok(expr(Expr.None()))
  assert.ok(expr(Expr.UnOp(Expr.None())))
  assert.ok(expr(Expr.BinOp(Expr.None(), Expr.None())))
  assert.not.ok(expr(Expr.BinOp(Expr.None(), 123 as any)))
})

test('primitives', () => {
  assert.ok(type.string('hello'))
  assert.not.ok(type.string(123))
  assert.ok(type.number(123))
  assert.not.ok(type.number('hello'))
  assert.ok(type.boolean(true))
  assert.not.ok(type.boolean('hello'))
  assert.ok(type.symbol(Symbol('hello')))
  assert.not.ok(type.symbol('hello'))
  assert.ok(type.bigint(BigInt(123)))
  assert.not.ok(type.bigint('hello'))
})

test('dates', () => {
  assert.ok(type.date(new Date()))
  assert.not.ok(type.date('hello'))
})

test('arrays', () => {
  assert.not.ok(type.array(type.string)('hello'))
  assert.ok(type.array(type.string)(['hello', 'world']))
  assert.not.ok(type.array(type.string)(['hello', 123]))
  assert.ok(type.array(type.number)([123, 456]))
  assert.not.ok(type.array(type.number)([123, 'hello']))
})

test('records', () => {
  assert.ok(type.record(type.string)({hello: 'world'}))
  assert.not.ok(type.record(type.string)({hello: 123}))
  assert.ok(type.record(type.number)({hello: 123}))
  assert.not.ok(type.record(type.number)({hello: 123, second: true}))
})

test('objects', () => {
  assert.ok(
    type.object({
      hello: type.string,
      world: type.number
    })({hello: 'world', world: 123})
  )
  assert.not.ok(
    type.object({
      hello: type.string,
      world: type.number
    })({hello: 'world', world: 'hello'})
  )
})

test('unions', () => {
  assert.ok(type.union(type.string, type.number)('hello'))
  assert.ok(type.union(type.string, type.number)(123))
  assert.not.ok(type.union(type.string, type.number)(true))
})

test('enums', () => {
  assert.ok(type.enums({hello: 'world'})('hello'))
  assert.not.ok(type.enums({hello: 'world'})('world'))
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
  assert.ok(type.string.nullable(null))
  assert.ok(type.nullable(type.string)('hello'))
  assert.not.ok(type.nullable(type.string)(123))
})

test('optional', () => {
  assert.ok(type.string.optional(undefined))
  assert.ok(type.optional(type.string)('hello'))
  assert.not.ok(type.optional(type.string)(123))
})

test('literal', () => {
  assert.ok(type.literal('hello')('hello'))
  assert.not.ok(type.literal('hello')('world'))
})

test('tuples', () => {
  const tuple = type.tuple(type.string, type.number)
  assert.ok(tuple(['hello', 123]))
  assert.not.ok(tuple(['hello', 'world']))
})

test.run()
