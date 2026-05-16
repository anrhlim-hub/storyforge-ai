import { S3Client, DeleteObjectCommand, PutObjectCommand as PutCmd } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export function isR2Configured(): boolean {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL
    && R2_ACCOUNT_ID !== "your_r2_account_id");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutCmd({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }),
  );
}

export async function uploadFromUrl(
  key: string,
  sourceUrl: string,
  contentType: string,
): Promise<void> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Gagal download dari ${sourceUrl}: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await uploadBuffer(key, buffer, contentType);
}

export function buildAssetKey(
  episodeId: string,
  type: string,
  filename: string,
): string {
  const ts = Date.now();
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `episodes/${episodeId}/${type}/${ts}_${clean}`;
}
