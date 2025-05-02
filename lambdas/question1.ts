import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    // Check if this is the crew/movies endpoint
    if (event.pathParameters?.movieId) {
      const movieId = event.pathParameters.movieId;
      const role = event.queryStringParameters?.role;

      if (role) {
        // Case 1: Get specific crew member by role
        const commandOutput = await client.send(
          new GetCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
              movieId: movieId,
              role: role
            }
          })
        );

        if (!commandOutput.Item) {
          return {
            statusCode: 404,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ message: "Crew member not found" }),
          };
        }

        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(commandOutput.Item),
        };
      } else {
        // Case 2: Get all crew members for the movie
        const commandOutput = await client.send(
          new QueryCommand({
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: "movieId = :movieId",
            ExpressionAttributeValues: {
              ":movieId": movieId
            }
          })
        );

        if (!commandOutput.Items || commandOutput.Items.length === 0) {
          return {
            statusCode: 404,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ message: "No crew members found for this movie" }),
          };
        }

        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(commandOutput.Items),
        };
      }
    }

    return {
      statusCode: 400,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Missing movieId parameter" }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
