import { add } from "./logic"

// Minimal shape of the fields this handler actually reads off the
// API Gateway proxy-integration event (avoids depending on @types/aws-lambda).
interface ApiGatewayEvent {
  body: string | null
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
  const args = JSON.parse(event.body ?? "{}")
  const result = add(args)

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
