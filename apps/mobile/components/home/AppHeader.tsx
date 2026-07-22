import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getUserDisplayProfile } from '@/lib/auth/profile-display';
import { palette } from '@/lib/theme/tokens';

export function AppHeader({ cityName }: { cityName?: string }) {
  const { session, user } = useAuth();
  const profile = getUserDisplayProfile(user);

  return (
    <View style={styles.wrap}>
      <View>
        <Logo size={26} />
        {cityName ? <Text style={styles.city}>{cityName}</Text> : null}
      </View>
      <View style={styles.actions}>
        <Pressable hitSlop={10} onPress={() => router.push('/buscar-nativo')} style={styles.iconBtn}>
          <Ionicons name="search" size={20} color={palette.ink900} />
        </Pressable>
        <Pressable
          hitSlop={10}
          onPress={() => router.push(session ? '/(tabs)/perfil' : '/(auth)/entrar')}
          style={styles.iconBtn}
        >
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.profileAvatar} contentFit="cover" />
          ) : (
            <Ionicons name="person-circle-outline" size={22} color={palette.ink900} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.paper,
  },
  city: { fontSize: 12, color: palette.ink600, fontWeight: '700', marginTop: 2, marginLeft: 38 },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
