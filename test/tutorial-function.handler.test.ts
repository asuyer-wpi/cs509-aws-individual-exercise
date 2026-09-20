import { readFileSync } from "fs"
import { join } from "path"
import { handler } from "../lib/tutorial-function"

// Same fixture used by `npm run test:sam`, so the event shape asserted here
// matches what actually gets exercised locally via sam local invoke.
const addEvent = JSON.parse(
  readFileSync(join(__dirname, "events", "tutorial-function", "add.event.json"), "utf-8"),
)

test("handler invoked with the add.json API Gateway event returns the sum", async () => {
  const result = await handler(addEvent)

  expect(result.statusCode).toBe(200)
  expect(JSON.parse(result.body)).toEqual(25)
})
