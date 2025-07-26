// src/services/s3Service.js
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Upload URL (PUT)
export const generateUploadUrl = async () => {
    const fileKey = `uploads/${uuidv4()}`; // use any prefix you like

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Expires: 60 * 5, // 5 minutes
        ContentType: 'application/octet-stream', // or 'image/jpeg', etc.
    };

    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    return { uploadUrl, fileKey };
};

// Download URL (GET)
export const generateDownloadUrl = async (fileKey) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Expires: 60 * 5,
    };

    const downloadUrl = await s3.getSignedUrlPromise('getObject', params);
    return downloadUrl;
};
