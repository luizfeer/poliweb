# Poliweb Agenda

App Expo (SDK 57) que abre https://www.poliwebapp.com.br/ num WebView. A navegação principal é a tab bar nativa em `src/NativeTabBar.tsx`, não o Expo Router.

O Android usa o pacote `br.com.poliwebapp.www.twa` para substituir a TWA na Play. O passo a passo de keystore, FCM e submit interno está no `README.md`. Não rode `eas build` nem `eas submit` da raiz do repositório.

Antes de mudar uma API do Expo, confira a versão em `package.json` e a doc em `https://docs.expo.dev/versions/v57.0.0/`.

Comandos, sempre a partir de `mobile/`:

```bash
npx expo install <pacote>
npx tsc --noEmit
node --experimental-strip-types --test src/*.test.ts
npx expo start --web
```

Não crie `ios/` nem `android/` à mão. O nativo sai do `app.json` no prebuild da EAS. Não rode `eas build` da raiz do repositório Quasar.
