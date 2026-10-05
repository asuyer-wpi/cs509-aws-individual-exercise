import path from "node:path"

import * as apigateway from "aws-cdk-lib/aws-apigateway"

import * as lambda from "aws-cdk-lib/aws-lambda"
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs"
import * as cdk from "aws-cdk-lib/core"

import type { Construct } from "constructs"

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Get the name of this stage
    const stageName = cdk.Stage.of(this)?.stageName ?? "default"

    // Create tutorial-function lambda function
    const tutorialFunction = new nodejs.NodejsFunction(this, "tutorial-function", {
      runtime: lambda.Runtime.NODEJS_22_X,

      // Path to file contianing handler function.
      entry: path.join(__dirname, "tutorial-function", "index.ts"),

      // If the exported function in the above file is not named "handler", then uncomment
      // and update the line below:
      // handler: "function_name",
    })

    // Declare tutorial-api API gateway
    const api = new apigateway.RestApi(this, "tutorial-api", {
      restApiName: `${stageName.toLowerCase()}-TutorialAPI`,

      // Enable CORS for all methods and all origins on all resources in the API
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },

      // Make URLs end in /api/ instead of /prod/
      deployOptions: { stageName: "api" },  
    })

    // Create /calc resource and assign tutorial-function as the resource
    const calc = api.root.addResource("calc")
    calc.addMethod("POST", new apigateway.LambdaIntegration(tutorialFunction))


    const sumFunction = new nodejs.NodejsFunction(this, "Sum", {
      runtime: lambda.Runtime.NODEJS_22_X,

      // Path to file contianing handler function.
      entry: path.join(__dirname, "sum-function", "index.ts"),

      // If the exported function in the above file is not named "handler", then uncomment
      // and update the line below:
      // handler: "function_name",
    })

    // /sum-of/{arg1}/and/{arg2}
    const sumOf = api.root.addResource("sum-of")
    const arg1 = sumOf.addResource("{arg1}")
    const and = arg1.addResource("and")
    const arg2 = and.addResource("{arg2}")
    arg2.addMethod("POST", new apigateway.LambdaIntegration(sumFunction))
  }
}
