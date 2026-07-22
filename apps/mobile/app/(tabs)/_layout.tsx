import { Ionicons } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StyleSheet } from 'react-native';

import { useAuth } from '@/lib/auth/AuthProvider';
import { getUserDisplayProfile } from '@/lib/auth/profile-display';
import { useUnreadNotifications } from '@/lib/inbox/use-unread';
import { palette } from '@/lib/theme/tokens';
import { useImmersiveState } from '@/lib/ui/immersive';

const ACTIVE = palette.clay500;
/** Ícones/labels sobre fundo escuro (blur material dark). */
const INACTIVE = 'rgba(255,255,255,0.55)';
const TAB_BAR_BG = 'rgba(0,0,0,0.82)';
const ICON_SIZE = 24;

/**
 * Abas nativas — 4 tabs minimalistas (Opção C).
 * WebViews abertos a partir da home ficam no Stack de `index/`.
 */
export default function TabsLayout() {
  const { count: unreadCount } = useUnreadNotifications();
  const { user } = useAuth();
  const profile = getUserDisplayProfile(user);
  const badge = unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined;
  const immersive = useImmersiveState();

  return (
    <NativeTabs
      hidden={immersive}
      tintColor={ACTIVE}
      iconColor={{ default: INACTIVE, selected: ACTIVE }}
      blurEffect="systemChromeMaterialDark"
      backgroundColor={TAB_BAR_BG}
      disableTransparentOnScrollEdge
      labelStyle={{
        default: { fontWeight: '700', color: 'rgba(255,255,255,0.72)' },
        selected: { fontWeight: '700', color: ACTIVE },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house.fill"
          src={<Ionicons name="home" size={ICON_SIZE} color={INACTIVE} />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mensagens">
        <NativeTabs.Trigger.Label>Mensagens</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="message.fill"
          src={<Ionicons name="chatbubbles" size={ICON_SIZE} color={INACTIVE} />}
        />
        {badge ? <NativeTabs.Trigger.Badge>{badge}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explorar">
        <NativeTabs.Trigger.Label>Explorar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="map.fill"
          src={<Ionicons name="compass" size={ICON_SIZE} color={INACTIVE} />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="comunidade">
        <NativeTabs.Trigger.Label>Comunidade</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.3.fill"
          src={<Ionicons name="people" size={ICON_SIZE} color={INACTIVE} />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>{profile.shortName}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.crop.circle.fill"
          src={<Ionicons name="person-circle" size={ICON_SIZE} color={INACTIVE} />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const styles = StyleSheet.create({});
