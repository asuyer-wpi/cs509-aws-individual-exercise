#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core"
import { TutorialStage } from "../lib/tutorial-stage"

const app = new cdk.App()

// Main stages
new TutorialStage(app, "Production", {})
new TutorialStage(app, "Staging", {})

// Developer stages (one per developer)
new TutorialStage(app, "asuyer", {})

