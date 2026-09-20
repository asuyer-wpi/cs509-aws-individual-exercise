import path from "node:path"

import * as apigateway from "aws-cdk-lib/aws-apigateway"

import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cdk from "aws-cdk-lib/core"

import type { Construct } from "constructs"

export class TutorialStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

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
      restApiName: "TutorialAPI",

      // Enable CORS for all methods and all origins on all resources in the API
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    })

    // Create /calc resource and assign tutorial-function as the resource
    const calc = api.root.addResource("calc")
    calc.addMethod("POST", new apigateway.LambdaIntegration(tutorialFunction))

    // Create a publicly acessible bucket to host a static website
    const staticWebsiteBucket = new s3.Bucket(this, "bucket", {
      // Bucket name must be globally unique within region
      bucketName: "cs509-asuyer-tutorial",

      // ACLs disabled >> Bucket owner preferred
      // objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,

      // Do NOT block any public access
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      },

      // Enable everybody read access to the bucket
      // accessControl: s3.BucketAccessControl.PUBLIC_READ,

      // Auto-delete objects when this stack is destroyed
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,

      // Set entry page for site
      websiteIndexDocument: "index.html",
    })

    // Output the website URL
    new cdk.CfnOutput(this, "StaticWebsiteURL", {
      value: staticWebsiteBucket.bucketWebsiteUrl,
    })

    // Alternative to a static bucket website: private bucket + cloudfront CDN

    // Private bucket that will contain website files (uploaded manually)
    const bucket = new s3.Bucket(this, "privatebucket", {
      bucketName: "cs509-asuyer-tutorial2",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // Cloudfront distribution to server the website files
    const distribution = new cloudfront.Distribution(this, "distribution", {
      // Served when someone requests "/"
      defaultRootObject: "index.html",

      defaultBehavior: {
        // Creates the OAC and adds the bucket policy for you
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },

      // Serve from US/Canada/Europe edges only (cheaper if you ever exceed the free tier)
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    })

    // Print CloudFront website URL
    new cdk.CfnOutput(this, "CloudFrontWebsiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
    })
    new cdk.CfnOutput(this, "DistributionId", { value: distribution.distributionId })
  }
}
