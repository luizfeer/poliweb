import { AdminEditLink } from '@/components/public/admin-edit-link';
import { getProfile, hasRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';

type TourismAdminEditLinkProps = {
  href: string;
  label?: string;
};

export async function TourismAdminEditLink({ href, label }: TourismAdminEditLinkProps) {
  const [auth, city] = await Promise.all([getProfile(), getCurrentCity()]);
  if (!auth || !city) return null;
  if (!hasRole(auth.roles, ['city_admin', 'super_admin', 'moderator'], city.id)) return null;

  return <AdminEditLink href={href} label={label} />;
}

export async function TourismAdminEditBar({ href, label }: TourismAdminEditLinkProps) {
  const link = await TourismAdminEditLink({ href, label });
  if (!link) return null;
  return <div className="flex justify-end px-3.5 py-2 md:px-6 lg:px-8">{link}</div>;
}
