import { add } from "../lib/tutorial-function/logic"
import { describeCases } from "./helpers/describeCases"

describeCases("add", add, [
  { input: { arg1: 10, arg2: 15 }, expected: 25 },
  { input: { arg1: 0, arg2: 5 }, expected: 5 },
  { input: { arg1: 0.5, arg2: 0.2 }, expected: 0.7 },
  { input: { arg1: -5, arg2: 3 }, expected: -2 },
])
