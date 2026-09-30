#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core"
import { ApiStack } from "../lib/api-stack"
import { FrontendStack } from "../lib/frontend-stack"

const app = new cdk.App()
new ApiStack(app, "ApiStack", {})
new FrontendStack(app, "FrontendStack", {})

