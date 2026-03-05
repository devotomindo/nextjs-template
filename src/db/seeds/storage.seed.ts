import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";

import { StorageBucket, getS3Client } from "@/lib/s3-storage";

/** Delete every object inside a bucket. No-ops if bucket doesn't exist. */
async function emptyBucket(name: string): Promise<void> {
  const s3 = getS3Client();

  // Check bucket exists first
  try {
    await s3.send(new HeadBucketCommand({ Bucket: name }));
  } catch {
    return; // bucket doesn't exist yet — nothing to empty
  }

  let continuationToken: string | undefined;
  let deleted = 0;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: name,
        ContinuationToken: continuationToken,
      }),
    );

    if (list.Contents) {
      await Promise.all(
        list.Contents.map((obj) =>
          s3.send(
            new DeleteObjectCommand({ Bucket: name, Key: obj.Key ?? "" }),
          ),
        ),
      );
      deleted += list.Contents.length;
    }

    continuationToken = list.IsTruncated
      ? list.NextContinuationToken
      : undefined;
  } while (continuationToken);

  if (deleted > 0) {
    console.log(`  Emptied bucket "${name}" (${deleted} objects deleted)`);
  }
}

async function ensureBucket(
  name: string,
  options: { publicRead: boolean },
): Promise<void> {
  const s3 = getS3Client();

  // Check if bucket already exists
  try {
    await s3.send(new HeadBucketCommand({ Bucket: name }));
    console.log(`  Bucket "${name}" already exists`);
  } catch (error: unknown) {
    const code =
      error instanceof Error && "name" in error ? error.name : undefined;

    if (code === "NotFound" || code === "NoSuchBucket") {
      try {
        await s3.send(new CreateBucketCommand({ Bucket: name }));
        console.log(`  Created bucket "${name}"`);
      } catch (createError: unknown) {
        const createCode =
          createError instanceof Error && "name" in createError
            ? createError.name
            : undefined;
        // Race condition: another process created it first
        if (createCode !== "BucketAlreadyOwnedByYou") {
          throw createError;
        }
        console.log(`  Bucket "${name}" already exists (race condition)`);
      }
    } else {
      throw error;
    }
  }

  // Apply public-read policy (idempotent)
  if (options.publicRead) {
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${name}/*`,
        },
      ],
    });

    await s3.send(new PutBucketPolicyCommand({ Bucket: name, Policy: policy }));
    console.log(`  Applied public-read policy to "${name}"`);
  }
}

export async function seedStorage(): Promise<void> {
  console.log("\nSeeding storage buckets...");

  // Empty existing buckets (mirrors DB seeds deleting existing rows)
  await emptyBucket(StorageBucket.PUBLIC);
  await emptyBucket(StorageBucket.PRIVATE);

  // Ensure buckets exist with correct policies
  await ensureBucket(StorageBucket.PUBLIC, { publicRead: true });
  await ensureBucket(StorageBucket.PRIVATE, { publicRead: false });

  console.log("Storage buckets seeded successfully!\n");
}
