import Image from 'next/image';
import { UsersRound } from 'lucide-react';
import { toggleCommunityGroupFollowAction } from '@/lib/community/actions';
import type { CommunityGroupFollower } from '@/lib/community/types';

type CommunityGroupFollowersProps = {
  cityId: string;
  groupId: string;
  groupSlug: string;
  followers: CommunityGroupFollower[];
  isFollowing: boolean;
};

export function CommunityGroupFollowers({
  cityId,
  groupId,
  groupSlug,
  followers,
  isFollowing,
}: CommunityGroupFollowersProps) {
  return (
    <section className="space-y-4 border-y bg-card px-4 py-5 sm:rounded-lg sm:border">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Quem acompanha</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {followers.length === 1 ? '1 pessoa segue este grupo.' : `${followers.length} pessoas seguem este grupo.`}
          </p>
        </div>
        <form action={toggleCommunityGroupFollowAction}>
          <input type="hidden" name="city_id" value={cityId} />
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="group_slug" value={groupSlug} />
          <button
            type="submit"
            className={isFollowing ? 'rounded-md border px-4 py-2 text-sm' : 'rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground'}
          >
            {isFollowing ? 'Seguindo' : 'Seguir grupo'}
          </button>
        </form>
      </div>

      {followers.length > 0 ? (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
          {followers.map((follower) => (
            <div key={follower.id} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
              {follower.avatarUrl ? (
                <Image
                  src={follower.avatarUrl}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="size-16 rounded-full border object-cover shadow-sm"
                />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-full border bg-secondary text-lg font-semibold shadow-sm">
                  {(follower.fullName ?? 'CL').slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="w-full truncate text-xs font-medium">
                {firstName(follower.fullName) ?? 'Morador'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-secondary/50 p-3 text-sm text-muted-foreground">
          Seja a primeira pessoa a acompanhar este grupo por aqui.
        </p>
      )}
    </section>
  );
}

function firstName(value: string | null): string | null {
  return value?.trim().split(/\s+/)[0] ?? null;
}
