export type MediaRole = 'logo' | 'cover' | 'gallery' | 'avatar' | 'attachment' | 'ad';

export type PickedAsset = {
  uri: string;
  mime: string;
  size: number | null;
  fileName: string;
  kind: 'image' | 'video';
  width?: number | null;
  height?: number | null;
};

export type UploadStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'failed'
  | 'cancelled';

export type UploadJob = {
  id: string;
  citySlug: string;
  entityType: string;
  entityId: string;
  role: MediaRole;
  label?: string | null;
  asset: PickedAsset;
  status: UploadStatus;
  progress: number; // 0..1
  attempts: number;
  error?: string | null;
  result?: UploadResult | null;
  createdAt: number;
  updatedAt: number;
};

export type UploadResult = {
  id: string;
  url: string;
  contentType: string;
  role: MediaRole;
};

export type UploadTokenResponse = {
  token: string;
  expiresAt: number;
  processorUrl: string;
  citySlug: string;
  entityType: string;
  entityId: string;
  role: MediaRole;
  unique: boolean;
  maxBytes: number;
};

export type ProcessedUpload = {
  bucket: string;
  storagePath: string;
  cdnUrl: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  originalFilename: string;
  originalContentType?: string;
  originalSizeBytes?: number;
  width?: number | null;
  height?: number | null;
};
