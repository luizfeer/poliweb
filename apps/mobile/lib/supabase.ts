import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { env } from './env';

const SECURE_STORE_CHUNK_LIMIT = 2000;

const secureStorage = {
  async getItem(key: string) {
    // Tenta SecureStore primeiro (valores pequenos). Se não tem (null) ou falha,
    // cai pro AsyncStorage (valores grandes como a session completa do Supabase).
    try {
      const fromSecure = await SecureStore.getItemAsync(key);
      if (fromSecure) return fromSecure;
    } catch {
      // ignore — fallback abaixo
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (value.length > SECURE_STORE_CHUNK_LIMIT) {
      // Valor grande: vai pro AsyncStorage. Apaga do SecureStore pra não ler stale.
      await SecureStore.deleteItemAsync(key).catch(() => undefined);
      await AsyncStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
      // Apaga eventual cópia antiga no AsyncStorage pra evitar leitura stale.
      await AsyncStorage.removeItem(key).catch(() => undefined);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string) {
    await Promise.all([
      SecureStore.deleteItemAsync(key).catch(() => undefined),
      AsyncStorage.removeItem(key),
    ]);
  },
};

export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? AsyncStorage : secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
