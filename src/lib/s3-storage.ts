import { env } from "@/env";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getStorageBucketAndPath(fullPath: string) {
  const [bucket, ...path] = fullPath.split("/");
  return { bucket, path: path.join("/") };
}

const S3_ACCESS_KEY = env.MINIO_ROOT_USER;
const S3_SECRET_KEY = env.MINIO_ROOT_PASSWORD;
const S3_ENDPOINT = env.MINIO_ENDPOINT;

// Configure S3-compatible client
export function getS3Client({
  region = "us-east-1",
}: { region?: string } = {}) {
  return new S3Client({
    region, // Required for AWS S3, but minio doesn't need it
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO
  });
}

/**
 * Converts a stored file path to a URL
 * @param filePath - The file path stored in the database (e.g., "post/123-abc.jpg")
 * @param options - Configuration options
 * @param options.isPrivate - Whether the file is in a private bucket requiring authentication (default: false)
 * @param options.expiresIn - Expiration time in seconds for signed URLs (default: 3600 = 1 hour)
 * @returns A URL for the file (signed URL for private files, direct URL for public files)
 */
export async function getFileUrl<T extends boolean | undefined = false>(
  filePath: string | null | undefined,
  options?: {
    isPrivate?: T;
    expiresIn?: number;
  },
): Promise<T extends true ? string | null : string> {
  if (!filePath) return null as any;

  const { isPrivate = false, expiresIn = 3600 } = options || {};
  const { bucket, path } = getStorageBucketAndPath(filePath);

  // For public files, return a direct URL
  if (!isPrivate) {
    return `${S3_ENDPOINT}/${bucket}/${path}`;
  }

  // For private files, generate a signed URL
  const s3Client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("[S3-STORAGE-UTILS] Error generating signed URL:", error);
    return null as any;
  }
}

/**
 * Downloads a file from storage and returns it as a stream
 * @param filePath - The file path stored in the database (e.g., "bucket/path/to/file.jpg")
 * @returns A promise that resolves to a stream containing the file contents
 */
export async function getObject(filePath: string) {
  const s3Client = getS3Client();
  const { bucket, path } = getStorageBucketAndPath(filePath);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  try {
    const response = await s3Client.send(command);
    // Return the object's body stream
    return response.Body;
  } catch (error) {
    console.error("[S3-STORAGE-UTILS] Error downloading file from S3:", error);
    throw new Error(
      `[S3-STORAGE-UTILS] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Downloads a file from storage and returns it as a buffer
 * @param filePath - The file path stored in the database (e.g., "bucket/path/to/file.jpg")
 * @returns A promise that resolves to a buffer containing the file contents
 */
export async function downloadFile(filePath: string): Promise<Buffer> {
  try {
    const fileObject = await getObject(filePath);
    if (!fileObject) {
      throw new Error("[S3-STORAGE-UTILS] Failed to get file object");
    }

    const fileBuffer = await fileObject.transformToByteArray();
    return Buffer.from(fileBuffer);
  } catch (error) {
    console.error("[S3-STORAGE-UTILS] Error downloading file:", error);
    throw new Error(
      `[S3-STORAGE-UTILS] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Downloads a file from storage and returns it as a base64 string
 * @param filePath - The file path stored in the database (e.g., "bucket/path/to/file.jpg")
 * @returns A promise that resolves to a base64 string containing the file contents
 */
export async function downloadFileAsBase64(filePath: string): Promise<string> {
  const fileBuffer = await downloadFile(filePath);
  return fileBuffer.toString("base64");
}

/**
 * Converts a readable stream to a buffer
 * @param stream - The readable stream to convert
 * @returns A promise that resolves to a buffer
 */
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const reader = stream.getReader();

    const read = async () => {
      const { done, value } = await reader.read();
      if (done) {
        resolve(Buffer.concat(chunks));
        return;
      }
      chunks.push(value);
      read();
    };
    read();
  });
}

/**
 * Uploads a file to S3 storage
 * @param filePath - The destination path in S3 (e.g., "bucket/path/to/file.jpg")
 * @param fileContent - The file content as Buffer or readable stream
 * @param contentType - MIME type of the file (e.g., "image/jpeg")
 * @returns A promise that resolves to the uploaded file path
 */
export async function uploadFile(
  filePath: string,
  fileContent: Buffer | ReadableStream | File,
  contentType?: string,
): Promise<string> {
  const s3Client = getS3Client();
  const { bucket, path } = getStorageBucketAndPath(filePath);

  // transform all fileContent to buffer
  let fileBuffer: Buffer;
  if (fileContent instanceof Buffer) {
    fileBuffer = fileContent;
  } else if (fileContent instanceof ReadableStream) {
    fileBuffer = await streamToBuffer(fileContent);
  } else if (fileContent instanceof File) {
    fileBuffer = Buffer.from(await fileContent.arrayBuffer());
  } else {
    throw new Error("Unsupported file content type");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
    Body: fileBuffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    return filePath;
  } catch (error) {
    console.error("[S3-STORAGE-UTILS] Error uploading file to S3:", error);
    throw new Error(
      `[S3-STORAGE-UTILS] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Deletes a file from S3 storage
 * @param filePath - The path of the file to delete (e.g., "bucket/path/to/file.jpg")
 * @returns A promise that resolves when the file is successfully deleted
 */
export async function deleteFile(filePath: string): Promise<void> {
  const s3Client = getS3Client();
  const { bucket, path } = getStorageBucketAndPath(filePath);

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error("[S3-STORAGE-UTILS] Error deleting file from S3:", error);
    throw new Error(
      `[S3-STORAGE-UTILS] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
