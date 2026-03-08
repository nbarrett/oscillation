import { NextRequest, NextResponse } from "next/server"
import { uploadChatImage } from "@/lib/s3"

const MAX_SIZE = 4 * 1024 * 1024

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const sessionId = formData.get("sessionId") as string | null

  if (!file || !sessionId) {
    return NextResponse.json({ error: "Missing file or sessionId" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadChatImage(sessionId, buffer, file.type)

  return NextResponse.json({ url })
}
