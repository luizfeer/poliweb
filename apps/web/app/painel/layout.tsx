import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PainelEntryAnalytics } from '@/components/analytics/painel-entry-analytics';
import { PanelSubmitGuard } from '@/components/admin/forms/panel-submit-guard';
import { PainelSidebar } from '@/components/painel/sidebar';
import { ProfileCompletionBanner } from '@/components/painel/profile-completion-banner';
import { getCurrentCity } from '@/lib/cities';
import { requireProfile } from '@/lib/auth';
import { getUnreadNotificationCount } from '@/lib/notifications';
import { isMobileAppRequest } from '@/lib/runtime/mobile-app';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const [auth, city, isMobile] = await Promise.all([
    requireProfile(),
    getCurrentCity(),
    isMobileAppRequest(),
  ]);

  if (!city) {
    redirect('/');
  }

  const unreadNotifications = await getUnreadNotificationCount(auth.profile.id);

  if (isMobile) {
    return (
      <main className="min-h-svh bg-white">
        <PanelSubmitGuard />
        <Suspense fallback={null}>
          <PainelEntryAnalytics />
        </Suspense>
        <div className="px-4 py-4">
          {(!auth.profile.phone || !auth.profile.birth_date) && (
            <ProfileCompletionBanner
              missingPhone={!auth.profile.phone}
              missingBirthDate={!auth.profile.birth_date}
            />
          )}
          {children}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-paper-deep px-3 py-3 sm:px-4 sm:py-4 md:min-h-[calc(100svh-4rem)]">
      <PanelSubmitGuard />
      <Suspense fallback={null}>
        <PainelEntryAnalytics />
      </Suspense>
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-5">
        <PainelSidebar auth={auth} city={city} unreadNotifications={unreadNotifications} />
        <section className="min-w-0 rounded-xl border border-ink-100 bg-white p-3 shadow-card sm:p-4 lg:min-h-[calc(100svh-6rem)] lg:p-5">
          {(!auth.profile.phone || !auth.profile.birth_date) && (
            <ProfileCompletionBanner
              missingPhone={!auth.profile.phone}
              missingBirthDate={!auth.profile.birth_date}
            />
          )}
          {children}
        </section>
      </div>
    </main>
  );
}
