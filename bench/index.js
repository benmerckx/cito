import {bench, group, run} from 'mitata'
import {validate} from 'superstruct'
import data from './data.json' assert {type: 'json'}
import {cito, superstruct, zod} from './types.js'

group('validate', () => {
  bench('zod', () => zod.safeParse(data))
  bench('superstruct', () => validate(data, superstruct, {coerce: true}))
  bench('cito', () => cito(data))
})

await run()
