import {
  StoryPhotoGallery,
  type StoryGalleryPhoto,
} from '@/components/public/media/story-photo-gallery';
import type { ChurchPhoto } from '@/lib/churches/types';

type ChurchPhotoGalleryProps = {
  churchName: string;
  photos: ChurchPhoto[];
};

export function ChurchPhotoGallery({ churchName, photos }: ChurchPhotoGalleryProps) {
  return (
    <StoryPhotoGallery
      title={churchName}
      photos={photos.map((photo): StoryGalleryPhoto => ({
        src: photo.src,
        attribution: photo.attribution,
        contentType: photo.contentType,
      }))}
    />
  );
}
