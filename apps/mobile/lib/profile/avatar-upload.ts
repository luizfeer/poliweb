import type { User } from '@supabase/supabase-js';

import { invalidatePainelMenu } from '@/lib/perfil/menu';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { pickMedia } from '@/lib/uploads/pick';
import { finalizeUpload, requestUploadToken, uploadToProcessor } from '@/lib/uploads/upload';

type UploadProfileAvatarOptions = {
  user: User;
  onProgress?: (progress: number) => void;
};

export async function pickAndUploadProfileAvatar({
  user,
  onProgress,
}: UploadProfileAvatarOptions): Promise<string | null> {
  const [asset] = await pickMedia({ accept: 'image', max: 1, source: 'gallery' });
  if (!asset) return null;

  const token = await requestUploadToken({
    citySlug: env.defaultCitySlug,
    entityType: 'profile',
    entityId: user.id,
    role: 'avatar',
  });

  const processed = await uploadToProcessor({
    asset,
    token,
    onProgress: (pct) => onProgress?.(Math.min(0.9, pct / 100)),
  });

  onProgress?.(0.92);
  const result = await finalizeUpload({
    citySlug: token.citySlug,
    entityType: 'profile',
    entityId: user.id,
    role: 'avatar',
    processed,
  });

  const metadata = {
    ...(user.user_metadata ?? {}),
    avatar_url: result.url,
  };

  await supabase.auth.updateUser({ data: metadata });
  await invalidatePainelMenu(user.id);
  onProgress?.(1);

  return result.url;
}
