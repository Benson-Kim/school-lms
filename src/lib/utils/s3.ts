import AWS from "aws-sdk";
import logger from "./logger";
import { ApiError } from "./api";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
  signatureVersion: "v4", // Use v4 for security
});

export async function uploadToS3(file: File, prefix: string): Promise<string> {
  /**
   * Uploads a file to AWS S3 with the specified prefix (e.g., "students/<studentId>").
   * Returns the public URL of the uploaded file.
   * @param file - The File object to upload
   * @param prefix - The directory path in S3 (e.g., "students/STU-123")
   * @returns Public URL of the uploaded file
   * @throws ApiError if upload fails
   */
  try {
    const fileKey = `${prefix}/${Date.now()}-${file.name}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileKey,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      ACL: "private", // Restrict access for security
    };

    // Upload to S3
    await s3.upload(params).promise();

    // Generate a signed URL for secure access (optional, based on needs)
    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: params.Bucket,
      Key: fileKey,
      Expires: 3600, // URL expires in 1 hour
    });

    logger.info(`Successfully uploaded file ${file.name} to S3 at ${fileKey}`);
    return signedUrl;
  } catch (error) {
    logger.error(
      `S3 upload failed for file ${file.name}: ${(error as Error).message}`,
      { error },
    );
    throw new ApiError(
      `Failed to upload file to S3: ${(error as Error).message}`,
      500,
    );
  }
}

export async function deleteFromS3(fileKey: string): Promise<void> {
  /**
   * Deletes a file from AWS S3.
   * @param fileKey - The S3 key of the file to delete
   * @throws ApiError if deletion fails
   */
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileKey,
    };

    await s3.deleteObject(params).promise();
    logger.info(`Successfully deleted file from S3: ${fileKey}`);
  } catch (error) {
    logger.error(
      `S3 deletion failed for key ${fileKey}: ${(error as Error).message}`,
      { error },
    );
    throw new ApiError(
      `Failed to delete file from S3: ${(error as Error).message}`,
      500,
    );
  }
}
