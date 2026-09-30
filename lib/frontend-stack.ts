import * as cdk from "aws-cdk-lib"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as s3 from "aws-cdk-lib/aws-s3"
import type { Construct } from "constructs"

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ------------------------------------------------------------------------ //
    // Method 1: host static files publicly in an S3 bucket                     //
    // ------------------------------------------------------------------------ //

    // Create a publicly acessible bucket to host a static website
    const staticWebsiteBucket = new s3.Bucket(this, "bucket", {
      // Bucket name must be globally unique within region
      bucketName: "cs509-asuyer-tutorial",

      // Do NOT block any public access
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      },

      // Auto-delete objects when this stack is destroyed
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,

      // Set entry page for site
      websiteIndexDocument: "index.html",
    })

    // Output the website URL
    new cdk.CfnOutput(this, "StaticWebsiteBucketURL", {
      value: staticWebsiteBucket.bucketWebsiteUrl,
    })

    // ------------------------------------------------------------------------ //
    // Method 2: private S3 bucket + CloudFront CDN                             //
    // ------------------------------------------------------------------------ //

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

      // Serve from US/Canada/Europe edges only (cheaper if we ever exceed the free tier)
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    })

    // Print CloudFront website URL
    new cdk.CfnOutput(this, "CloudFrontWebsiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
    })
    new cdk.CfnOutput(this, "DistributionId", { value: distribution.distributionId })
  }
}
