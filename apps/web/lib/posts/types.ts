export type EntityPostType = 'business' | 'church';

export type EntityPost = {
  id: string;
  cityId: string;
  entityType: EntityPostType;
  entityId: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  pinned: boolean;
  publishedAt: string;
  createdAt: string;
};
