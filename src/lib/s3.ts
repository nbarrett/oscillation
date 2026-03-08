import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
})

const BUCKET = process.env.AWS_S3_BUCKET ?? "oscillation-chat"

export async function uploadChatImage(
  sessionId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const ext = contentType.split("/")[1] ?? "png"
  const key = `chat/${sessionId}/${randomUUID()}.${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return `https://${BUCKET}.s3.${process.env.AWS_REGION ?? "eu-west-1"}.amazonaws.com/${key}`
}
