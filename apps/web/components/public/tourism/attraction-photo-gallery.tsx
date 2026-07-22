import {
  StoryPhotoGallery,
  type StoryGalleryPhoto,
} from '@/components/public/media/story-photo-gallery';

export type AttractionGalleryPhoto = StoryGalleryPhoto;

type AttractionPhotoGalleryProps = {
  attractionName: string;
  photos: AttractionGalleryPhoto[];
  id?: string;
  photoAnchorPrefix?: string;
};

export function AttractionPhotoGallery({
  attractionName,
  photos,
  id,
  photoAnchorPrefix,
}: AttractionPhotoGalleryProps) {
  return (
    <StoryPhotoGallery
      id={id}
      title={attractionName}
      photos={photos}
      photoAnchorPrefix={photoAnchorPrefix}
    />
  );
}
