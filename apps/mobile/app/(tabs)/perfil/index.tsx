import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListItem } from '@/components/home/ListItem';
import { Button } from '@/components/ui/Button';
import { TabsScreen } from '@/components/ui/TabsScreen';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getUserDisplayProfile } from '@/lib/auth/profile-display';
import { pickAndUploadProfileAvatar } from '@/lib/profile/avatar-upload';
import { palette } from '@/lib/theme/tokens';
import { useTabBarScrollPadding } from '@/lib/ui/tab-bar-inset';

export default function PerfilScreen() {
  const tabBarPad = useTabBarScrollPadding();
  const { user, session, signOut } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  if (!session) {
    return (
      <TabsScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.guest, { paddingBottom: tabBarPad }]}>
          <Ionicons name="person-circle-outline" size={72} color={palette.ink400} />
          <Text style={styles.guestTitle}>Entre para acessar seu painel</Text>
          <Text style={styles.guestSub}>
            Acompanhe seus negócios, favoritos e notificações em todas as cidades.
          </Text>
          <Button onPress={() => router.push('/(auth)/entrar')} fullWidth>
            Entrar
          </Button>
          <Pressable onPress={() => router.push('/(auth)/cadastro')}>
            <Text style={styles.signupLink}>Criar conta grátis</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      </TabsScreen>
    );
  }

  const profile = getUserDisplayProfile(user);

  async function handleChangeAvatar() {
    if (!user || uploadingAvatar) return;
    setUploadingAvatar(true);
    setAvatarProgress(0);
    try {
      const url = await pickAndUploadProfileAvatar({
        user,
        onProgress: setAvatarProgress,
      });
      if (url) {
        Alert.alert('Foto atualizada', 'Sua nova foto de perfil já está valendo no app.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar a foto.';
      Alert.alert('Erro ao trocar foto', message);
    } finally {
      setUploadingAvatar(false);
      setAvatarProgress(0);
    }
  }

  return (
    <TabsScreen>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPad }]}>
        <View style={styles.header}>
          <Pressable
            onPress={handleChangeAvatar}
            disabled={uploadingAvatar}
            style={({ pressed }) => [styles.avatarWrap, (pressed || uploadingAvatar) && styles.headerPressed]}
            accessibilityRole="button"
            accessibilityLabel={uploadingAvatar ? 'Enviando foto de perfil' : 'Trocar foto de perfil'}
          >
            <View style={styles.avatarSurface}>
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatarImg}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{profile.initial}</Text>
                </View>
              )}

              {uploadingAvatar ? (
                <View style={styles.avatarUploadOverlay}>
                  <ActivityIndicator size="small" color={palette.white} />
                  <Text style={styles.avatarUploadText}>{Math.round(avatarProgress * 100)}%</Text>
                </View>
              ) : null}
            </View>

            {!uploadingAvatar ? (
              <View style={styles.avatarBadge} pointerEvents="none">
                <Ionicons name="camera" size={14} color={palette.white} />
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/perfil/webview/raw?p=%2Fpainel%2Fperfil' as never)}
            style={({ pressed }) => [styles.profileMeta, pressed && styles.headerPressed]}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Text style={styles.name} numberOfLines={1}>{profile.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ListItem
            icon="business-outline"
            tone="cerrado"
            title="Meu painel"
            sub="Classificados, grupos, comércios e posts"
            href="/(tabs)/perfil/webview/raw?p=%2Fpainel%2Fcidadao"
          />
          <ListItem
            icon="heart-outline"
            tone="clay"
            title="Favoritos"
            href="/(tabs)/perfil/webview/raw?p=%2Fpainel%2Ffavoritos"
          />
          <ListItem
            icon="notifications-outline"
            tone="sky"
            title="Notificações"
            sub="Dispositivos e preferências"
            href="/(tabs)/perfil/notificacoes"
          />
          <ListItem
            icon="settings-outline"
            tone="paper"
            title="Configurações"
            href="/(tabs)/perfil/webview/raw?p=%2Fpainel%2Fperfil"
          />
        </View>

        <View style={styles.section}>
          <ListItem
            icon="sparkles-outline"
            tone="sky"
            title="Serviços públicos"
            sub="Coleta, telefones, farmácias e alertas"
            href="/webview/servicos"
          />
          <ListItem
            icon="megaphone-outline"
            tone="sun"
            title="Anuncie no portal"
            sub="Destaques e visibilidade extra"
            href="/webview/anuncie"
          />
          <ListItem
            icon="color-palette-outline"
            tone="clay"
            title="Meu comércio e artes"
            sub="Gere artes pro Instagram e gerencie seu negócio"
            href="/(tabs)/perfil/webview/raw?p=%2Fpainel%2Fcomercio"
          />
          <ListItem
            icon="people-outline"
            tone="cerrado"
            title="Indicar amigos"
            sub="Convide e ganhe pontos"
            href="/(tabs)/perfil/webview/raw?p=%2Fpainel%2Fcidadao%2Findicar"
          />
          <ListItem
            icon="ribbon-outline"
            tone="cerrado"
            title="Meus pontos"
            sub="Saldo e histórico de fidelidade"
            href="/(tabs)/perfil/webview/raw?p=%2Fpainel%2Fcidadao%2Fpontos"
            divider={false}
          />
        </View>

        <View style={styles.section}>
          <ListItem
            icon="document-text-outline"
            tone="paper"
            title="Termos de uso"
            href="/(tabs)/perfil/webview/raw?p=%2Ftermos"
          />
          <ListItem
            icon="lock-closed-outline"
            tone="paper"
            title="Privacidade"
            href="/(tabs)/perfil/webview/raw?p=%2Fprivacidade"
          />
          <ListItem
            icon="trash-outline"
            tone="clay"
            title="Excluir conta"
            sub="Solicitar exclusão da sua conta"
            href="/(tabs)/perfil/webview/raw?p=%2Fpainel%2Fperfil%2Fprivacidade"
            divider={false}
          />
        </View>

        <View style={{ padding: 16 }}>
          <Button variant="secondary" onPress={signOut} fullWidth>
            Sair
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
    </TabsScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  scroll: {},
  guest: { padding: 24, gap: 12, flex: 1, justifyContent: 'center', alignItems: 'center' },
  guestTitle: { fontSize: 20, fontWeight: '900', color: palette.ink900, textAlign: 'center' },
  guestSub: { fontSize: 13, color: palette.ink600, textAlign: 'center', marginBottom: 8 },
  signupLink: { color: palette.cerrado700, fontWeight: '800', marginTop: 8 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerPressed: { opacity: 0.72 },
  avatarWrap: {
    width: 76,
    height: 76,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSurface: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.cerrado700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: palette.white, fontSize: 28, fontWeight: '900' },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.ink100,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.cerrado700,
    borderWidth: 2,
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarUploadText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '800',
  },
  profileMeta: { alignItems: 'center', gap: 4 },
  name: { fontSize: 20, fontWeight: '900', color: palette.ink900 },
  email: { fontSize: 13, color: palette.ink600 },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
    overflow: 'hidden',
  },
});
