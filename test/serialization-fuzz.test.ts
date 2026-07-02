import test from "ava"
import { DefaultSerializer, extendSerializer } from "../src/serializers"

// Deterministic PRNG (mulberry32) so failures are reproducible — no external
// fuzzing dependency and no reliance on Math.random.
function makeRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomJsonValue(rng: () => number, depth: number): unknown {
  const pick = rng()
  if (depth <= 0 || pick < 0.35) {
    // Primitives — including the falsey values that used to be dropped (#471).
    const primitives: unknown[] = [0, -0, 1, -1, 3.14, "", "hello", "0", false, true, null]
    return primitives[Math.floor(rng() * primitives.length)]
  }
  if (pick < 0.7) {
    const length = Math.floor(rng() * 4)
    return Array.from({ length }, () => randomJsonValue(rng, depth - 1))
  }
  const keys = Math.floor(rng() * 4)
  const obj: Record<string, unknown> = {}
  for (let i = 0; i < keys; i++) {
    obj[`k${i}`] = randomJsonValue(rng, depth - 1)
  }
  return obj
}

test("DefaultSerializer round-trips arbitrary JSON-serializable values", t => {
  const rng = makeRng(0x1234abcd)
  for (let i = 0; i < 500; i++) {
    const value = randomJsonValue(rng, 4)
    const roundTripped = DefaultSerializer.deserialize(DefaultSerializer.serialize(value) as any)
    t.deepEqual(roundTripped, value, `round-trip mismatch on iteration ${i}`)
  }
})

test("DefaultSerializer round-trips Error instances preserving name/message/stack", t => {
  const rng = makeRng(0x55aa00ff)
  const errorCtors = [Error, TypeError, RangeError, SyntaxError]
  for (let i = 0; i < 200; i++) {
    const Ctor = errorCtors[Math.floor(rng() * errorCtors.length)]
    const message = `err-${Math.floor(rng() * 1e6)}`
    const original = new Ctor(message)
    const restored: Error = DefaultSerializer.deserialize(DefaultSerializer.serialize(original) as any)
    t.true(restored instanceof Error)
    t.is(restored.message, original.message)
    t.is(restored.name, original.name)
    t.is(restored.stack, original.stack)
  }
})

test("extended serializer falls back to the default for unhandled values", t => {
  // A serializer that only knows about Date, delegating everything else.
  const withDates = extendSerializer(DefaultSerializer, {
    deserialize(message: any, fallback) {
      return message && message.__date ? new Date(message.__date) : fallback(message)
    },
    serialize(input: any, fallback) {
      return input instanceof Date ? { __date: input.toISOString() } : fallback(input)
    }
  })

  const date = new Date("2020-01-02T03:04:05.000Z")
  const restoredDate: Date = withDates.deserialize(withDates.serialize(date))
  t.true(restoredDate instanceof Date)
  t.is(restoredDate.toISOString(), date.toISOString())

  // Non-Date values still round-trip through the default serializer.
  t.deepEqual(withDates.deserialize(withDates.serialize({ a: 1, b: [false, "", 0] })), { a: 1, b: [false, "", 0] })
})
