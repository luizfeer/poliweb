# Poliweb Agenda

App Expo (SDK 57) que abre o mesmo site da TWA:

`https://www.poliwebapp.com.br/`

Esse é o `start_url` do manifest em `quasar.conf.js`.

| Loja | Identificador | Versão de usuário | Build |
| --- | --- | --- | --- |
| App Store | `br.com.poliwebapp` (Poliweb Agenda, Apple ID `1659657349`, Team ID `Y6FSFUALV7`) | `1.0.2` (`expo.version`) | build `11` já publicado. O próximo iOS continua no contador remoto do EAS |
| Play Store | `br.com.poliwebapp.www.twa` (o mesmo pacote da TWA) | `1.2.0` (`android.version`) | `versionCode` **22** no primeiro AAB, acima do `21` da TWA |

O `projectId` EAS é `fc60cdda-2f91-4bc4-ad63-bfd71098d09e`, conta `luizalmeidadev`.

Os comandos abaixo rodam **dentro de `mobile/`**. Não rode o EAS na raiz do repositório Quasar. Não rode `eas build` nem `eas submit` até terminar a seção [Antes do primeiro build Android](#antes-do-primeiro-build-android).

## O que o shell faz

- Splash nativa (`expo-splash-screen`) com a esfera estática em fundo branco, igual nos dois sistemas. Em seguida a intro em Reanimated: a esfera entra girando, fica em loop com “Poliweb” e some em fade quando o site monta.
- WebView em tela cheia. No Android o desenho é edge-to-edge: a faixa de cima usa o inset da status bar na cor `#1976D2`, com ícones escuros durante a intro branca e claros depois. A tab bar branca ocupa o inset da navigation bar, com botões escuros.
- Tab bar nativa: Início, Categorias, Cidades, Buscar e Perfil (`/`, `/encontre`, `/cidades`, `/buscar`, `/perfil`). A navbar flutuante do site é escondida.
- Pull-to-refresh, gesto de voltar no iOS e botão voltar no Android. O voltar do Android chama `goBack()` no histórico do WebView e só fecha o app quando `canGoBack` é falso. O gesto preditivo fica desligado para o `BackHandler` receber o toque.
- WhatsApp (`wa.me` e `whatsapp:`), `tel:`, `mailto:`, `geo:`, mapas e outros domínios abrem fora do WebView. Iframes (anúncio, reCAPTCHA, mapa embutido) continuam na página. No Android, `target="_blank"` passa por `onOpenWindow`.
- App Links `https://poliwebapp.com.br` e `https://www.poliwebapp.com.br`, com `autoVerify`. Um link desses abre a rota no WebView em vez da home.
- Tela offline com “Tentar de novo”.
- `<input type="file">` do site, inclusive `capture="environment"`, usa o seletor do sistema e o app de câmera. A permissão `CAMERA` fica bloqueada de propósito: se ela estiver no manifesto e ainda não tiver sido concedida, o `react-native-webview` omite a câmera do seletor. A câmera pede a permissão dela mesma.
- Geolocalização do site (`navigator.geolocation`) pede `ACCESS_FINE_LOCATION` quando a página usa. O WebView só libera a origem se a pessoa aceitar.
- Push com `expo-notifications`. No Android o `devicePushToken` é o token FCM. O canal padrão é `default`.

## Pré-requisitos

- Node.js 22 ou mais novo
- Conta Expo `luizalmeidadev`
- Para iOS: Apple Developer do time `Y6FSFUALV7`
- Para Android: o keystore de upload que já assina a TWA, na máquina do dono. Não gere outro.

```bash
cd mobile
npm install
```

## Rodar localmente

Não há simulador de iOS neste ambiente Linux. No Mac, a splash nativa só aparece num development build, não no Expo Go. No navegador, a intro e o site abrem numa coluna estreita, num iframe.

```bash
npx expo start --web
```

Checagens:

```bash
npx tsc --noEmit
node --experimental-strip-types --test src/*.test.ts
```

## Versões

`cli.appVersionSource` é **`remote`**. O `versionCode` e o `buildNumber` que vão no binário moram no EAS, não no `app.json`. Isso é de propósito: o iOS já publicado é o build `11`, e o `ios.buildNumber` local ainda é `"2"`. Trocar a fonte para `local` faria o próximo iOS sair como build `2` e a App Store recusar.

O que o `app.json` controla de fato:

- `version` `1.0.2`: version name do iOS. Não mexa para publicar o Android.
- `android.version` `1.2.0`: `versionName` do Android. O remoto não substitui esse campo.
- `android.versionCode` `22`: semente. Com `autoIncrement` e sem contador Android no EAS, o primeiro build somaria 1 e sairia **23**. O comando da seção abaixo fixa o remoto em **21** para o primeiro AAB sair **22**.

Os perfis `development`, `preview` e `production` usam `autoIncrement`. Um build Android de development ou preview também consome um `versionCode`. Rode o `build:version:set` imediatamente antes do `eas build` de produção, sem outro build Android no meio.

O perfil `production` gera **AAB** (`app-bundle`). A Play não aceita APK nesse fluxo.

## Antes do primeiro build Android

Faça nesta ordem, na máquina que tem o keystore. Nada disso entra no git.

### 1. Conferir o keystore de upload

O SHA-256 da chave de upload da TWA começa com `7D:73:58:F2` e termina com `97:E5`. Confira o arquivo da box antes de enviar:

```bash
keytool -list -v -keystore /caminho/do-keystore.jks
```

O alias e as duas senhas (store e key) precisam ser os mesmos da TWA. Se o EAS gerar um keystore novo, a Play recusa o AAB.

### 2. Enviar o keystore para o EAS

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest credentials -p android
```

Na CLI:

1. Perfil: `production`
2. `Keystore: Manage everything needed to build your project`
3. `Set up a new keystore` não serve. Escolha **Upload an existing keystore** (ou o equivalente “I want to upload my own keystore”)
4. Informe o caminho do `.jks` ou `.keystore`, a senha do store, o alias e a senha da key

Repita o perfil `preview` só se for assinar um APK interno com a mesma chave. O binário da Play usa o perfil `production`.

### 3. Firebase e `google-services.json`

O repositório não tem projeto Firebase. Crie um só para o app Android.

1. Abra o [Firebase Console](https://console.firebase.google.com/) e crie um projeto, por exemplo `poliweb-agenda`. Não precisa ativar Google Analytics.
2. Adicione um app **Android**. O package name tem de ser exatamente `br.com.poliwebapp.www.twa`.
3. Baixe o `google-services.json`.
4. Coloque o arquivo em `mobile/google-services.json`. O `app.json` já aponta `android.googleServicesFile` para `./google-services.json`.
5. Faça commit desse arquivo. O EAS Build manda o que está no git; um arquivo só no disco, ignorado, não entra no build. O `google-services.json` tem o identificador público do app e a API key de cliente, não a chave privada do FCM.

Se a API key desse JSON estiver restrita no Google Cloud, libere a **FCM Registration API** e a **Firebase Installations API**, ou deixe a key sem restrição de API. Na restrição de app Android, use o SHA-1 do certificado de **assinatura do app** (Play Console → Release → Setup → App integrity → App signing key certificate), não o SHA-1 da chave de upload. SHA-1 errado faz o token FCM falhar com `403 PERMISSION_DENIED`.

### 4. Credencial FCM V1 no EAS

Ainda no Firebase: Project settings → Service accounts → **Generate new private key**. Guarde o JSON fora do repositório. O `.gitignore` bloqueia `*firebase-adminsdk*.json` e `*service-account*.json`.

No [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam) do mesmo projeto, a conta de serviço precisa do papel **Firebase Cloud Messaging API Admin**. A chave gerada pelo Firebase já nasce com esse papel; se for reaproveitar outra conta, adicione o papel.

```bash
cd mobile
npx eas-cli@latest credentials -p android
```

1. Perfil: `production`
2. `Google Service Account`
3. `Manage your Google Service Account Key for Push Notifications (FCM V1)`
4. `Set up a Google Service Account Key for Push Notifications (FCM V1)` → `Upload a new service account key`
5. Aponte para o JSON privado. Não confirme se a CLI sugerir commitar o arquivo

O mesmo caminho no site: expo.dev → o projeto → Credentials → Android → `br.com.poliwebapp.www.twa` → Service credentials → FCM V1 service account key.

Sem esse JSON o app até gera um token, mas o Expo Push Service não entrega a notificação.

### 5. Conta de serviço da Play Console

É outro JSON, separado do FCM. Serve só para o `eas submit`.

1. No Google Cloud, crie uma conta de serviço (ou use uma que já envia a TWA).
2. Crie uma chave JSON e deixe o arquivo fora do git.
3. No Play Console → Users and permissions, convide o e-mail da conta de serviço com permissão de release para o app `br.com.poliwebapp.www.twa`.
4. Envie a chave ao EAS:

```bash
npx eas-cli@latest credentials -p android
```

Perfil `production` → `Google Service Account` → `Manage your Google Service Account Key for Play Store Submissions` → `Set up a Google Service Account Key for Play Store Submissions` → caminho do JSON.

O `eas.json` não aponta `serviceAccountKeyPath`. O submit usa a chave guardada no EAS.

### 6. Fixar o versionCode em 22

A TWA publicada está no `versionCode` 21. O remoto do Android, se existir, pode estar em 1 ou 2 por causa do valor antigo do `app.json`. Veja o que o EAS tem:

```bash
npx eas-cli@latest build:version:get -p android
```

Se não houver remoto, ou se o número for **menor ou igual a 21**, grave o último código da Play:

```bash
npx eas-cli@latest build:version:set -p android
```

Quando pedir o valor, informe **21**. Não informe 22: o `autoIncrement` do perfil `production` soma 1 na hora do build, e o AAB sai com **22**.

Se o comando já mostrar 22 ou mais, não volte para 21. O próximo build será esse número mais 1, e a Play aceita qualquer coisa acima de 21.

Não rode `build:version:set -p ios`. O contador iOS já está no build 11.

## Build e teste interno

Ainda em `mobile/`, com o `google-services.json` commitado e o keystore já no EAS:

```bash
npx eas-cli@latest build --profile production --platform android
```

Quando terminar:

```bash
npx eas-cli@latest submit --profile production --platform android
```

O perfil `production` de submit manda o AAB para a faixa **internal**. Escolha o build que acabou de sair. No Play Console, a release aparece em Teste interno do app que já existe (`br.com.poliwebapp.www.twa`), como atualização da TWA, não como app novo.

Confira no AAB, ou na página do build no expo.dev, `versionName` 1.2.0 e `versionCode` 22 (ou o número seguinte, se o remoto já tinha passado de 21).

Não use `eas build --platform android` a partir da raiz do Quasar.

### Notificação de teste no Android

Instale o build pelo teste interno, aceite o pedido de notificação e leia o token na página:

`window.__POLIWEB_NATIVE_PUSH__.expoPushToken`

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "to": "ExponentPushToken[cole-o-token]",
    "title": "Poliweb",
    "body": "Notificação de teste",
    "sound": "default",
    "channelId": "default",
    "data": { "path": "/buscar" }
  }'
```

`devicePushToken` no Android é o token nativo do FCM. O contrato com a página é o mesmo do iOS: `window.__POLIWEB_NATIVE_PUSH__`, `localStorage.poliweb_native_push`, o evento `poliweb-native-push` e `window.poliwebRegisterPushToken`.

## App Links

O manifest do app declara `autoVerify` para `https://poliwebapp.com.br` e `https://www.poliwebapp.com.br`.

O `assetlinks.json` publicado hoje em `https://www.poliwebapp.com.br/.well-known/assetlinks.json` lista só o SHA-256 `68:0B:87:95:73:46:DB:DA:44:23:1C:60:5C:D3:44:FD:9D:E6:18:42:DF:29:33:38:4F:61:D7:B0:1A:A7:CC:4C`. O SHA-256 da chave de upload (`7D:73:58:F2:…:97:E5`) não está nesse arquivo. A Play reassinou o AAB com a chave de assinatura do app, então o teste interno verifica o certificado da Play, não o de upload. Se esse `68:0B:…` for o certificado de assinatura do Google, os links do build da Play funcionam. Inclua também o fingerprint completo da chave de upload se for instalar um APK assinado só com ela.

Não substitua o `assetlinks.json` do site por uma cópia com um único fingerprint se a versão no ar tiver os dois.

## iOS

Development (simulador, dev client):

```bash
npx eas-cli@latest build --profile development --platform ios
```

Preview (ad hoc):

```bash
npx eas-cli@latest build --profile preview --platform ios
```

Production e envio para o app `1659657349`:

```bash
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest submit --profile production --platform ios
```

A chave `.p8` da APNs não entra no repositório. Ela fica no EAS, time `Y6FSFUALV7`:

```bash
npx eas-cli@latest credentials
```

iOS → perfil `production` → `Push Notifications: Manage your Apple Push Notifications Key` → o `.p8`, o Key ID e o Team ID `Y6FSFUALV7`.

## Ícone

`assets/icon.png` é a esfera em 1024×1024, PNG RGB, sem canal alpha. O ícone adaptativo do Android usa a mesma esfera com fundo transparente (`android-icon-foreground.png`), fundo branco e a versão monocromática. A splash e a intro usam `assets/splash-icon.png`. O ícone de notificação (`assets/notification-icon.png`) é um disco branco de 96×96 com fundo transparente, que é o formato que o Android tinge na status bar.
