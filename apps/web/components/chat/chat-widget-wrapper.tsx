import { getCurrentCity } from '@/lib/cities';
import { ChatWidget } from './chat-widget';

export async function ChatWidgetWrapper() {
  const city = await getCurrentCity();
  return <ChatWidget cityName={city?.name ?? 'Portal Carmelitano'} />;
}
