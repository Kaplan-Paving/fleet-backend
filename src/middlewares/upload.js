// src/middlewares/upload.js
import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();
// Setup AWS S3
export const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Configure Multer with S3

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "my-repair-ticket-files",
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const filename = `${Date.now()}-${file.originalname}`;
            cb(null, `uploads/${filename}`);
        }
    })
});

export const uploadAttachments = upload.array('attachments', 10);
