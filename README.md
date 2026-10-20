# AWS + CDK Tutorial

This is a tutorial for how to configure an AWS application using the cloud development kit
(CDK). The CDK allows you to declare your entire application infrastructure as code, which
has the following benefits:
- reproducibility
- version control
- understood by AI agents

## Initial setup

There are a couple of things you need to before you can start using the CDK.

1. Create a root AWS user account, then create IAM users for yourself and your team
2. Install and set up the `aws` CLI ([instructions here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html))
3. Install the `cdk` CLI by running `npm install -g aws-cdk`
4. Install the `sam` CLI ([instructions here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))

Once the above steps are completed, you need to prepare your AWS application to be managed
by the CDK by running the following command:

```sh
cdk bootstrap
```

## Architecture

This project creates an [app](https://docs.aws.amazon.com/cdk/v2/guide/apps.html) called 
**tutorial**, defined in `bin/tutorial.ts`.

The app defines the following [stages](https://docs.aws.amazon.com/cdk/v2/guide/stages.html):
- **Production**: the end-user facing product
- **Staging**: features that are getting ready to ship
- **asuyer**: where I develop new features

All the stages define the following [stacks](https://docs.aws.amazon.com/cdk/v2/guide/stacks.html),
which group related constructs together:
- **FrontendStack**: manages constructs for hosting the frontend. This stack demonstrates
  two methods for hosting static website files.
   - Method 1: a public S3 bucket with static website hosting
   - Method 2: a private S3 bucket + a CloudFront distribution to serve the site
- **ApiStack**: the backend API and lambda function handlers
   - Declares a REST API Gateway
   - Declares lambda functions to handle requests at different endpoints

Each stage effectively creates a copy of all the stacks within it, and by extension, a
copy of each construct.

```
$ cdk list

Production/ApiStack (Production-ApiStack)
Production/FrontendStack (Production-FrontendStack)
Staging/ApiStack (Staging-ApiStack)
Staging/FrontendStack (Staging-FrontendStack)
asuyer/ApiStack (asuyer-ApiStack)
asuyer/FrontendStack (asuyer-FrontendStack)
```

Production:
- API url: https://hr61wq5fb0.execute-api.us-east-2.amazonaws.com/api/
- Public S3 url: http://production-frontendstack-bucket43879c71-fyec7bfpcnxf.s3-website.us-east-2.amazonaws.com
- CloudFront url: https://d22417655qdwks.cloudfront.net

Staging:
- API url: https://ctp2tqw2dj.execute-api.us-east-2.amazonaws.com/api/
- Public S3 url: http://staging-frontendstack-bucket43879c71-to6gnsqnlzk4.s3-website.us-east-2.amazonaws.com
- CloudFront url: https://d38sh3v6yt896w.cloudfront.net

asuyer:
- API url: 
- Public S3 url:
- CloudFront url: 

## How to deploy

Deploying does the following things:
1. Synthesizes your TypeScript code into CloudFormation templates, which is AWS's internal
   representation of application infrastructure
2. Uploads these templates and assets to the AWS console

To deploy a particular stage, run the following command:

```sh
cdk deploy "<stage-name>/*" [--hotswap]
```

Using `--hotswap` when you only made edits to an existing lambda function. 

Example deploying staging stage:

```sh
cdk deploy "Staging/*"
```

## Lambda function development

The code for each NodeJS lambda function belongs in an isolated subdirectory of `lib`. It
is structured as a mini NodeJS project with a `package.json` file and one or more source
files. The name of the directory should follow `kebab-case` to match standard NodeJS
conventions.

```
lib/function-name/
|-- package.json
|-- index.ts        # can be .js, .mjs, .jsx, .tsx, .cjs, .cts
|-- ...
```

The entry file for the lambda function **must** export a function called `handler`. When
the lambda function is wired up to the Rest API Gateway as a Lambda Proxy Integration, this 
handler function receives an object containing a bunch of information about the request. A
full specification of the input object can be found 
[here](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format).
The handler function must return an object following a particular format which can be found
[here](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format).

Often, you do not need all the information that the input object provides, so you can
create a TypeScript interface that declares just the fields you need. For example, for the
`tutorial-function`, we only need the event body:

```ts
// lib/tutorial-function/index.ts

interface ApiGatewayEvent {
  body: string | null
}

interface ApiGatewayResult {
  isBase64Encoded: boolean
  statusCode: number
  headers: { [header: string]: string }
  multiValueHeaders: { [header: string]: string[] }
  body: string
}

export const handler = async (event: ApiGatewayEvent): Promise<ApiGatewayResult> => {
  // ...
}
```

To make the lambda function easier to test, you should separate the event handling logic
from the core business logic. The `handler` function should be responsible for extract URL 
and body parameters, validating the input, and bundling the output into the shape that the
API gateway expects. In the middle, it should defer the core behavior to a dedicated
function.

For example, the `tutorial-function` takes in two numbers, `arg1` and `arg2` (passed in
the `body` of the request) and returns the sum of the numbers. The `handler` function
parses the event body, makes sure that both `arg1` and `arg2` are present, then passes
these arguments to the `add` function defined in `lib/tutorial-function/logic.ts`. The
important parts of the code are pasted below:

```ts
// lib/tutorial-function/index.ts
export const handler = async (event: ApiGatewayEvent): Promise<ApiGatewayResult> => {
  const args = JSON.parse(event.body ?? "{}")

  // ... check that args.arg1 and args.arg2 exist, return HTTP 400 if not

  const result = add(args)
  return {
    body: JSON.stringify(result)
    // ... (other required API gateway parameters)
  }
}

// lib/tutorial-function/logic.ts
export interface AddArgs {
  arg1: number
  arg2: number
}

export interface AddResult {
  sum: number
}

export function add(args: AddArgs): AddResult {
  return {
    sum: args.arg1 + args.arg2
  }
}
```

### Connecting to API gateway

#todo create NodeJsFunction


### Writing test cases

Two categories of test cases:
- Logic test: tests the core logic function (e.g., the `add` function)
- Request/response test: tests the event handler function (parsing parameters, etc.)

Test cases for the core logic function should be put in a file
`test/function-name.test.ts`, where `function-name` is the same name as the lambda
function directory (e.g., `tutorial-function`). In this file, create test inputs and
outputs to the core handler function. The `describeCases` helper function can help with
this.

```sh
// test/tutorial-function.test.ts
import { add } from "../lib/tutorial-function/logic"
import { describeCases } from "./helpers/describeCases"

// Test cases for the add function
describeCases("add", add, [
  { input: { arg1: 10, arg2: 15 }, expected: { sum: 25 } },
  { input: { arg1: 0, arg2: 5 }, expected: { sum: 5 } },
  { input: { arg1: 0.5, arg2: 0.2 }, expected: { sum: 0.7 } },
  { input: { arg1: -5, arg2: 3 }, expected: { sum: -2 } },
])
```

To test the handler logic, we need to simulate an event from the API gateway. This can be
done using the 
[AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).


Create two files inside `test/function-name/`: `<name>.event.json` and
`<name>.expected.json`.


### How to test


Run lambda function logic unit tests:

```sh
npm run test
```

Run lambda function request/response test with:

```sh
npm run test:sam
```


