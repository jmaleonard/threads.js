import test from "ava"
import { ThreadCloneError } from "../src/index"
import { isDataCloneError } from "../src/errors"

test("ThreadCloneError is an Error with a preserved cause and correct name", t => {
  const cause = new Error("original")
  const error = new ThreadCloneError("wrapped message", cause)

  t.true(error instanceof Error)
  t.true(error instanceof ThreadCloneError)
  t.is(error.name, "ThreadCloneError")
  t.is(error.message, "wrapped message")
  t.is(error.cause, cause)
})

test("ThreadCloneError works without a cause", t => {
  const error = new ThreadCloneError("no cause")
  t.is(error.cause, undefined)
  t.is(error.message, "no cause")
})

test("isDataCloneError only matches errors named DataCloneError", t => {
  t.true(isDataCloneError({ name: "DataCloneError" }))
  t.true(isDataCloneError(Object.assign(new Error("x"), { name: "DataCloneError" })))

  t.false(isDataCloneError(null))
  t.false(isDataCloneError(undefined))
  t.false(isDataCloneError("DataCloneError"))
  t.false(isDataCloneError(42))
  t.false(isDataCloneError({}))
  t.false(isDataCloneError(new Error("plain")))
})
