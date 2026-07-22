import Image from 'next/image';
import type { EntityPost } from '@/lib/posts/types';
import { videoPosterUrl } from '@/lib/media/video-poster';

type Props = {
  posts: EntityPost[];
};

export function EntityPostsSection({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-bold">Novidades</h2>
      <div className="grid gap-3">
        {posts.map((post) => (
          <EntityPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function EntityPostCard({ post }: { post: EntityPost }) {
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(post.publishedAt));

  return (
    <article className="overflow-hidden rounded-2xl border bg-white">
      {post.videoUrl ? (
        <video
          src={post.videoUrl}
          controls
          playsInline
          preload="metadata"
          poster={post.imageUrl ?? videoPosterUrl(post.videoUrl) ?? undefined}
          className="aspect-video w-full bg-muted object-cover"
        />
      ) : post.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}
      <div className="p-4">
        {post.pinned && (
          <span className="mb-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Fixada
          </span>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-snug">{post.title}</h3>
          <time className="shrink-0 text-xs text-muted-foreground">{date}</time>
        </div>
        {post.body && (
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {post.body}
          </p>
        )}
        {post.buttonLabel && post.buttonUrl && (
          <a
            href={post.buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
          >
            {post.buttonLabel} →
          </a>
        )}
      </div>
    </article>
  );
}
