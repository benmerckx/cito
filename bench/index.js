import {TypeCompiler} from '@sinclair/typebox/compiler'
import {bench, group, run} from 'mitata'
import {validate} from 'superstruct'
import {compile} from '../dist/index.js'
import data from './data.json' assert {type: 'json'}
import {cito, superstruct, typebox, zod} from './types.js'

let jit = {}

group('compile', () => {
  bench('cito', () => (jit.cito = compile(cito)))
  bench('typebox jit', () => (jit.typebox = TypeCompiler.Compile(typebox)))
})

group('validate', () => {
  bench('zod', () => zod.safeParse(data))
  bench('superstruct', () => validate(data, superstruct, {coerce: true}))
  bench('cito', () => cito.check(data))
})

group('validate jit', () => {
  bench('cito jit', () => jit.cito.check(data))
  bench('typebox jit', () => jit.typebox.Check(data))
})

await run()
