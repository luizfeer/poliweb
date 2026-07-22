import { getCurrentCity } from '@/lib/cities';
import { SignInExperience } from '@/components/auth/sign-in-experience';

export const metadata = { title: 'Entrar — Portal Carmelitano' };

export default async function EntrarPage() {
  const city = await getCurrentCity();
  return <SignInExperience cityName={city?.name ?? 'Carmo do Rio Claro'} />;
}
