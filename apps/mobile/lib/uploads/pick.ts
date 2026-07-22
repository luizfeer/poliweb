import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import type { PickedAsset } from './types';

type PickOptions = {
  accept?: 'image' | 'video' | 'mixed';
  max?: number;
  source?: 'gallery' | 'camera';
};

function inferMime(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.mimeType) return asset.mimeType;
  if (asset.type === 'video') return 'video/mp4';
  const ext = asset.fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'mp4' || ext === 'mov') return 'video/mp4';
  return 'image/jpeg';
}

function defaultName(asset: ImagePicker.ImagePickerAsset, idx: number): string {
  if (asset.fileName) return asset.fileName;
  const ts = Date.now();
  const ext = asset.type === 'video' ? 'mp4' : 'jpg';
  return `upload-${ts}-${idx}.${ext}`;
}

async function ensurePermission(source: 'gallery' | 'camera'): Promise<boolean> {
  const req =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (req.granted) return true;
  if (!req.canAskAgain) {
    Alert.alert(
      'Permissão necessária',
      source === 'camera'
        ? 'Habilite o acesso à câmera nas configurações para tirar fotos.'
        : 'Habilite o acesso à galeria nas configurações para enviar fotos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
      ],
    );
  }
  return false;
}

export async function pickMedia(options: PickOptions = {}): Promise<PickedAsset[]> {
  const accept = options.accept ?? 'mixed';
  const max = Math.max(1, Math.min(20, options.max ?? 10));
  const source = options.source ?? 'gallery';

  const granted = await ensurePermission(source);
  if (!granted) return [];

  const mediaTypes: ImagePicker.MediaType[] =
    accept === 'image'
      ? ['images']
      : accept === 'video'
        ? ['videos']
        : ['images', 'videos'];

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes,
          quality: 1,
          // 'Medium' iOS / 1 (medium) Android — compressão básica do sistema; o pesado vai pro media-processor.
          videoQuality: 1,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes,
          quality: 1,
          allowsMultipleSelection: max > 1,
          selectionLimit: max,
          videoQuality: 1,
        });

  if (result.canceled) return [];

  const picked: PickedAsset[] = result.assets.map((asset, idx) => {
    const mime = inferMime(asset);
    const kind: 'image' | 'video' = mime.startsWith('video/') ? 'video' : 'image';
    return {
      uri: asset.uri,
      mime,
      size: asset.fileSize ?? null,
      fileName: defaultName(asset, idx),
      kind,
      width: asset.width ?? null,
      height: asset.height ?? null,
    };
  });

  return picked;
}
