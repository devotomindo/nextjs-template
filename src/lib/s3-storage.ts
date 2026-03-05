import { env } from "@/env";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export const StorageBucket = {
  PUBLIC: "data",
  PRIVATE: "private-data",
} as const;

export type StorageBucketName =
  (typeof StorageBucket)[keyof typeof StorageBucket];

export function isBucketPrivate(bucketOrPath: string): boolean {
  const bucket = bucketOrPath.split("/")[0];
  return bucket === StorageBucket.PRIVATE;
}

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
 * Converts a stored file path to a URL.
 * Auto-detects whether the file is private based on bucket name in the path.
 * Private files get presigned URLs; public files get direct URLs.
 */
export async function getFileUrl(
  filePath: string,
  options?: { expiresIn?: number },
): Promise<string>;
export async function getFileUrl(
  filePath: string | null | undefined,
  options?: { expiresIn?: number },
): Promise<string | null>;
export async function getFileUrl(
  filePath: string | null | undefined,
  options?: { expiresIn?: number },
): Promise<string | null> {
  if (!filePath) return null;

  const { expiresIn = 3600 } = options ?? {};
  const { bucket, path } = getStorageBucketAndPath(filePath);

  if (!isBucketPrivate(filePath)) {
    return `${S3_ENDPOINT}/${bucket}/${path}`;
  }

  const s3Client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

export interface PresignedPutUrlOptions {
  contentType?: string;
  expiresIn?: number;
}

/**
 * Generates a presigned PUT URL for uploading a file to S3.
 * @param filePath - Full storage path including bucket (e.g., "private-data/match-id/file.mp4")
 */
export async function getPresignedPutUrl(
  filePath: string,
  options?: PresignedPutUrlOptions,
): Promise<string> {
  const { contentType, expiresIn = 3600 } = options ?? {};
  const s3Client = getS3Client();
  const { bucket, path } = getStorageBucketAndPath(filePath);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
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
 * Downloads a file from S3 storage directly to a local file using streaming
 * This avoids loading the entire file into memory and works for files > 2GB
 * @param storagePath - The file path in S3 (e.g., "bucket/path/to/file.mp4")
 * @param localFilePath - The local file path to save to
 * @returns A promise that resolves when the download is complete
 */
export async function streamDownloadFile(
  storagePath: string,
  localFilePath: string,
): Promise<void> {
  const s3Client = getS3Client();
  const { bucket, path } = getStorageBucketAndPath(storagePath);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  try {
    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("No body in S3 response");
    }

    // Convert the SDK stream to a Node.js readable stream and pipe to file
    const writeStream = fs.createWriteStream(localFilePath);
    const bodyStream = response.Body as Readable;

    await pipeline(bodyStream, writeStream);
  } catch (error) {
    console.error(
      "[S3-STORAGE-UTILS] Error streaming download from S3:",
      error,
    );
    throw new Error(
      `[S3-STORAGE-UTILS] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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
 * Uploads a file to S3 storage using multipart streaming upload
 * This avoids loading the entire file into memory and works for files > 2GB
 * @param filePath - The destination path in S3 (e.g., "bucket/path/to/file.mp4")
 * @param localFilePath - The local file path to upload
 * @param contentType - MIME type of the file (e.g., "video/mp4")
 * @param onProgress - Optional callback for upload progress
 * @returns A promise that resolves to the uploaded file path
 */
export async function streamUploadFile(
  filePath: string,
  localFilePath: string,
  contentType?: string,
  onProgress?: (progress: { loaded: number; total: number }) => void,
): Promise<string> {
  const s3Client = getS3Client();
  const { bucket, path } = getStorageBucketAndPath(filePath);

  // Create a read stream from the local file
  const fileStream = fs.createReadStream(localFilePath);
  const fileStats = fs.statSync(localFilePath);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: path,
      Body: fileStream,
      ContentType: contentType,
    },
    // 5MB part size (minimum for S3)
    partSize: 5 * 1024 * 1024,
    // Upload 4 parts concurrently
    queueSize: 4,
  });

  if (onProgress) {
    upload.on("httpUploadProgress", (progress) => {
      onProgress({
        loaded: progress.loaded ?? 0,
        total: fileStats.size,
      });
    });
  }

  try {
    await upload.done();
    return filePath;
  } catch (error) {
    console.error("[S3-STORAGE-UTILS] Error streaming upload to S3:", error);
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
