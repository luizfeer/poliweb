import { parseYouTubeVideoId, youtubeEmbedUrl } from '@/lib/utils/youtube';

type YouTubeEmbedProps = {
  url: string | null;
  title: string;
};

export function YouTubeEmbed({ url, title }: YouTubeEmbedProps) {
  const id = url ? parseYouTubeVideoId(url) : null;
  if (!id) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={youtubeEmbedUrl(id)}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
