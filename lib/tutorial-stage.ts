import * as cdk from "aws-cdk-lib"
import type { Construct } from "constructs"

import { ApiStack } from "../lib/api-stack"
import { FrontendStack } from "../lib/frontend-stack"

export class TutorialStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props)

    new ApiStack(this, "ApiStack", {})
    new FrontendStack(this, "FrontendStack", {})
  }
}
