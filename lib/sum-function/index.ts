import { add } from "./logic"

// Minimal shape of the fields this handler actually reads off the
// API Gateway proxy-integration event (avoids depending on @types/aws-lambda).
interface ApiGatewayEvent {
  body: string | null
  pathParameters: { [name: string]: string }
}

// This is the required format for an API Gateway lambda proxy response
// See: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
interface ApiGatewayResult {
  isBase64Encoded: boolean
  statusCode: number
  headers: { [header: string]: string }
  multiValueHeaders: { [header: string]: string[] }
  body: string
}

export const handler = async (event: ApiGatewayEvent): Promise<ApiGatewayResult> => {
  const args = event.pathParameters

  // Make sure both keys are provided
  let error = ""
  if (!Object.hasOwn(args, "arg1") && !Object.hasOwn(args, "arg2")) {
    error = "Missing path parameters arg1 and arg2"
  } else if (!Object.hasOwn(args, "arg1")) {
    error = "Missing path parameter arg1"
  } else if (!Object.hasOwn(args, "arg2")) {
    error = "Missing path parameter arg2"
  }

  // Return 400 error if missing keys
  if (error !== "") {
    return {
      isBase64Encoded: false,
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      multiValueHeaders: {},
      body: error,
    }
  }

  // Pass args to the adder
  const result = add({
    arg1: Number(args.arg1),
    arg2: Number(args.arg2),
  })

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    multiValueHeaders: {},
    body: JSON.stringify(result),
  }
}
