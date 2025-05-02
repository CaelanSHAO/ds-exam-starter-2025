import { SNSEvent } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.REGION });
const QUEUE_B_URL = process.env.QUEUE_B_URL;

export const handler = async (event: SNSEvent) => {
  console.log("Event: ", JSON.stringify(event));
  for (const record of event.Records) {
    const snsMessage = JSON.parse(record.Sns.Message);
    if (!snsMessage.email) {
      // 缺少 email，发送到 Queue B
      if (QUEUE_B_URL) {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: QUEUE_B_URL,
            MessageBody: JSON.stringify(snsMessage),
          })
        );
        console.log("Message sent to Queue B: ", JSON.stringify(snsMessage));
      }
    } else {
      // 有 email，正常处理（此处可扩展其他逻辑）
      console.log("Message has email, not sent to Queue B.");
    }
  }
  return {};
};
