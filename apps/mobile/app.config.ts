import type { ExpoConfig } from 'expo/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { envFlag, loadMobileEnv } = require('./config/load-mobile-env.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveWebBaseUrl } = require('./config/resolve-web-base-url.cjs');

const loadedEnv = loadMobileEnv();
const forceLocalDev = envFlag(loadedEnv.EXPO_PUBLIC_ALLOW_LOCALHOST_WEB_URL);
const webResolution = resolveWebBaseUrl({
  envUrl: loadedEnv.EXPO_PUBLIC_WEB_URL ?? process.env.EXPO_PUBLIC_WEB_URL,
  forceLocalDev,
});
const WEB_BASE_URL = webResolution.url;

const BUNDLE_ID = 'com.portalcarmelitano.app';
const SCHEME = 'carmelitano';
const APP_VERSION = '0.1.0';
const EAS_PROJECT_ID =
  process.env.EAS_PROJECT_ID ?? '43bce470-5e95-41b4-ab2e-133b1dd45b88';
const EAS_UPDATE_URL =
  process.env.EAS_UPDATE_URL ?? `https://u.expo.dev/${EAS_PROJECT_ID}`;
const GOOGLE_MAPS_API_KEY =
  loadedEnv.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? '';

const config: ExpoConfig = {
  name: 'Portal Carmelitano',
  slug: 'portal-carmelitano',
  version: APP_VERSION,
  scheme: SCHEME,
  orientation: 'portrait',
  icon: './assets/original/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#E0561B',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    associatedDomains: [
      'applinks:portalcarmelitano.com.br',
      'applinks:www.portalcarmelitano.com.br',
    ],
    infoPlist: {
      CFBundleDisplayName: 'Portal Carmelitano',
      CFBundleName: 'Portal Carmelitano',
      ITSAppUsesNonExemptEncryption: false,
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoadsInWebContent: true,
        NSAllowsLocalNetworking: true,
      },
      UIBackgroundModes: ['remote-notification'],
      NSUserNotificationUsageDescription:
        'Usamos notificações para avisar sobre alertas da cidade, eventos e respostas no painel.',
      NSMicrophoneUsageDescription:
        'Usamos o microfone para você ditar perguntas ao assistente.',
      NSSpeechRecognitionUsageDescription:
        'Usamos reconhecimento de voz para transcrever sua pergunta ao assistente.',
      NSLocationWhenInUseUsageDescription:
        'Mostramos sua posição no mapa para você encontrar pousadas, comércios e atrações perto de você.',
      NSPhotoLibraryUsageDescription:
        'Selecione fotos da galeria para enviar ao seu comércio ou anúncio.',
      NSCameraUsageDescription:
        'Use a câmera para tirar fotos e vídeos do seu comércio ou anúncio.',
    },
    usesAppleSignIn: true,
  },
  android: {
    package: BUNDLE_ID,
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    usesCleartextTraffic: true,
    adaptiveIcon: {
      foregroundImage: './assets/original/adaptive-icon.png',
      backgroundImage: './assets/adaptive-background.png',
      monochromeImage: './assets/adaptive-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          { scheme: 'https', host: 'portalcarmelitano.com.br' },
          { scheme: 'https', host: 'www.portalcarmelitano.com.br' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  } as NonNullable<ExpoConfig['android']> & { usesCleartextTraffic: boolean },
  plugins: [
    [
      'expo-router',
      {
        origin: WEB_BASE_URL,
      },
    ],
    'expo-secure-store',
    'expo-sqlite',
    'expo-localization',
    'expo-web-browser',
    'expo-apple-authentication',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#E0561B',
      },
    ],
    [
      'expo-video',
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#E0561B',
        image: './assets/splash.png',
        imageWidth: 200,
      },
    ],
    [
      'react-native-maps',
      {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Selecione fotos da galeria para enviar ao seu comércio ou anúncio.',
        cameraPermission:
          'Use a câmera para tirar fotos e vídeos do seu comércio ou anúncio.',
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'Permita o microfone para ditar perguntas ao assistente.',
        speechRecognitionPermission:
          'Permita o reconhecimento de voz para transcrever sua pergunta.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Mostramos sua posição no mapa para você encontrar pousadas, comércios e atrações perto de você.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    webBaseUrl: WEB_BASE_URL,
    webEnv: webResolution.mode,
    forceLocalDev,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
  updates: {
    url: EAS_UPDATE_URL,
    enabled: true,
    fallbackToCacheTimeout: 0,
    checkAutomatically: 'ON_LOAD',
  },
  runtimeVersion: APP_VERSION,
};

export default config;
