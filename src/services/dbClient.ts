import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });
export const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "";

// single-table design: PK/SK pattern
// User:    PK=USER#<userId>          SK=PROFILE
// Product: PK=USER#<userId>          SK=PRODUCT#<productId>
// Vendor:  PK=USER#<userId>          SK=VENDOR#<vendorId>

export async function putItem(item: Record<string, any>) {
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}

export async function getItem(pk: string, sk: string) {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk, SK: sk } })
  );
  return result.Item;
}

export async function queryByPrefix(pk: string, skPrefix: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: { ":pk": pk, ":skPrefix": skPrefix },
    })
  );
  return result.Items || [];
}
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

export async function deleteItem(pk: string, sk: string) {
  await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: pk, SK: sk } }));
}