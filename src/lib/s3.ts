import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.DO_SPACES_REGION!,
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false, // Required for DigitalOcean Spaces
  // Fix for SSL certificate issues
  maxAttempts: 3,
  retryMode: 'adaptive',
})

const bucketName = process.env.DO_SPACES_BUCKET!

export async function uploadFile(
  key: string,
  body: Buffer | string,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'private', // Private by default for security
    })

    await s3Client.send(command)
    // Use the configured endpoint directly instead of constructing it
    return `${process.env.DO_SPACES_ENDPOINT}/${key}`
  } catch (error) {
    console.error('DigitalOcean Spaces upload error:', error)
    throw new Error('Failed to upload file to DigitalOcean Spaces')
  }
}

export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    return getSignedUrl(s3Client, command, { expiresIn })
  } catch (error) {
    console.error('DigitalOcean Spaces signed URL error:', error)
    throw new Error('Failed to generate signed URL')
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('DigitalOcean Spaces delete error:', error)
    throw new Error('Failed to delete file from DigitalOcean Spaces')
  }
}

export function generateFileKey(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `users/${userId}/files/${timestamp}-${sanitizedFileName}`
}

export function generateAudioKey(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `users/${userId}/audio/${timestamp}-${sanitizedFileName}`
}

export function generateDocumentKey(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `users/${userId}/documents/${timestamp}-${sanitizedFileName}`
}

export default s3Client
