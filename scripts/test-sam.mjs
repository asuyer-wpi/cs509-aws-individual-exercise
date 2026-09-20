#!/usr/bin/env node
// Runs every Lambda function declared by the CDK app through `sam local
// invoke`, using fixture events/expectations under test/events/<function-id>.
// The function id passed to `sam local invoke` is the CDK construct id (the
// second segment of a Lambda resource's "aws:cdk:path" metadata, e.g.
// "TutorialStack/tutorial-function/Resource" -> "tutorial-function") - SAM
// resolves that back to the generated CloudFormation logical id itself, so
// this script never has to know or hardcode it.

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { basename, join } from "node:path"

const CDK_OUT_DIR = "cdk.out"
const EVENTS_DIR = "test/events"

function synth() {
  console.log("Synthesizing CDK app...")
  execFileSync("npx", ["cdk", "synth", "--quiet", "--no-staging"], { stdio: "inherit" })
}

function findStackTemplates() {
  const manifest = JSON.parse(readFileSync(join(CDK_OUT_DIR, "manifest.json"), "utf-8"))

  return Object.values(manifest.artifacts ?? {})
    .filter((artifact) => artifact.type === "aws:cloudformation:stack")
    .map((artifact) => join(CDK_OUT_DIR, artifact.properties.templateFile))
}

function findLambdaFunctionIds(templatePath) {
  const template = JSON.parse(readFileSync(templatePath, "utf-8"))

  return Object.values(template.Resources ?? {})
    .filter((resource) => resource.Type === "AWS::Lambda::Function")
    .map((resource) => {
      const cdkPath = resource.Metadata?.["aws:cdk:path"]
      const segments = cdkPath.split("/")
      // segments: [StackName, ...constructPath, "Resource"]
      return segments[segments.length - 2]
    })
}

function runCase(functionId, templatePath, eventFile) {
  const caseName = basename(eventFile, ".event.json")
  const expectedFile = eventFile.replace(/\.event\.json$/, ".expected.json")

  if (!existsSync(expectedFile)) {
    console.log(`  ~ ${caseName}: no ${basename(expectedFile)}, skipping`)
    return true
  }
  const expected = JSON.parse(readFileSync(expectedFile, "utf-8"))

  const stdout = execFileSync(
    "sam",
    ["local", "invoke", functionId, "-t", templatePath, "-e", eventFile],
    { stdio: ["ignore", "pipe", "inherit"] },
  ).toString()

  const raw = JSON.parse(stdout)
  const actual = {
    statusCode: raw.statusCode,
    body: raw.body === undefined ? undefined : JSON.parse(raw.body),
  }

  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`  ${pass ? "PASS" : "FAIL"} ${caseName}`)
  if (!pass) {
    console.log(`      expected: ${JSON.stringify(expected)}`)
    console.log(`      actual:   ${JSON.stringify(actual)}`)
  }
  return pass
}

function main() {
  synth()

  const templates = findStackTemplates()
  let allPassed = true
  let ranAnyCase = false

  for (const templatePath of templates) {
    for (const functionId of findLambdaFunctionIds(templatePath)) {
      const eventDir = join(EVENTS_DIR, functionId)
      if (!existsSync(eventDir)) {
        console.log(`${functionId}: no fixtures in ${eventDir}/, skipping`)
        continue
      }

      console.log(`${functionId}:`)
      const eventFiles = readdirSync(eventDir)
        .filter((file) => file.endsWith(".event.json"))
        .map((file) => join(eventDir, file))

      for (const eventFile of eventFiles) {
        ranAnyCase = true
        const passed = runCase(functionId, templatePath, eventFile)
        allPassed = allPassed && passed
      }
    }
  }

  if (!ranAnyCase) {
    console.log("No sam test fixtures found.")
  } else if (!allPassed) {
    console.error("\nsam local invoke tests FAILED")
    process.exit(1)
  } else {
    console.log("\nAll sam local invoke tests passed")
  }
}

main()
