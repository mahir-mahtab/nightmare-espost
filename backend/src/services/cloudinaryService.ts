import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

type UploadImageOptions = {
  folder?: string;
};

type CloudinaryUploadError = {
  message?: string;
  http_code?: number;
  statusCode?: number;
  name?: string;
  error?: {
    message?: string;
  };
};

const SQUARE_SIZE_PX = 1080;

if (env.CLOUDINARY_URL) {
  cloudinary.config(env.CLOUDINARY_URL);
  cloudinary.config({ secure: true });
}

const ensureCloudinaryConfigured = () => {
  if (!env.CLOUDINARY_URL) {
    throw new AppError(
      'Cloudinary is not configured. Please set CLOUDINARY_URL in backend environment variables.',
      500,
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }
};

const toCloudinaryAppError = (error: unknown) => {
  if (error instanceof AppError) {
    return error;
  }

  const cloudinaryError = error as CloudinaryUploadError;
  const statusCode = cloudinaryError.http_code ?? cloudinaryError.statusCode ?? 500;
  const providerMessage = cloudinaryError.error?.message || cloudinaryError.message || 'Cloudinary upload failed.';

  if (statusCode === 401) {
    return new AppError(
      'Cloudinary credentials are invalid. Please verify CLOUDINARY_URL API key and secret.',
      502,
      'CLOUDINARY_AUTH_FAILED',
      { providerMessage, statusCode }
    );
  }

  if (statusCode === 403) {
    return new AppError(
      'Cloudinary denied upload permission. Enable upload/create permission for this API key in Cloudinary Console.',
      502,
      'CLOUDINARY_UPLOAD_FORBIDDEN',
      { providerMessage, statusCode }
    );
  }

  return new AppError(
    'Cloudinary upload failed. Please verify Cloudinary account settings and try again.',
    502,
    'CLOUDINARY_UPLOAD_FAILED',
    { providerMessage, statusCode }
  );
};

const uploadImageBuffer = async (buffer: Buffer, options: UploadImageOptions = {}) => {
  ensureCloudinaryConfigured();

  const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? env.CLOUDINARY_UPLOAD_FOLDER,
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(toCloudinaryAppError(error ?? new Error('Cloudinary upload failed.')));
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });

  return uploadResult;
};

const getSquareOptimizedUrl = (publicId: string) => {
  ensureCloudinaryConfigured();

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: SQUARE_SIZE_PX,
        height: SQUARE_SIZE_PX,
        crop: 'fill',
        gravity: 'auto',
      },
      {
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  });
};

export const cloudinaryService = {
  uploadImageBuffer,
  getSquareOptimizedUrl,
};
