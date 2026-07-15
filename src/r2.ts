import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_BASE, // e.g. https://files.convrtd.co or https://<hash>.r2.dev (public bucket)
  R2_URL_TTL_DAYS,
} = process.env;

/** True when Cloudflare R2 upload is configured. */
export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
}

let client: S3Client | null = null;
function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}

/**
 * Upload a PDF to Cloudflare R2 and return a download URL. Uses a public base URL
 * when configured (public bucket / custom domain), otherwise a presigned GET URL.
 */
export async function uploadPdf(
  buffer: Buffer,
  key: string,
  downloadName: string,
): Promise<string> {
  await s3().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
      ContentDisposition: `attachment; filename="${downloadName}"`,
    }),
  );

  if (R2_PUBLIC_BASE) {
    return `${R2_PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
  }
  const ttlDays = Number(R2_URL_TTL_DAYS) || 7;
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: ttlDays * 24 * 60 * 60 },
  );
}
