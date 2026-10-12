# Poliweb Agenda (iOS)

App iOS do Poliweb em Expo (SDK 57). Substitui o wrapper antigo do PWABuilder e abre o mesmo site da TWA Android:

`https://www.poliwebapp.com.br/`

Esse é o `start_url` do manifest em `quasar.conf.js` e o destino do pacote `br.com.poliwebapp.www.twa`.

O app publicado na App Store é o **Poliweb Agenda** (Apple ID `1659657349`), bundle `br.com.poliwebapp`, conta Individual, Team ID `Y6FSFUALV7`. A versão de loja continua `1.0.1`. O `buildNumber` deste projeto começa em `2` porque o build `1` já foi publicado pelo wrapper antigo.

O `android.package` é `br.com.poliwebapp.www.twa` só para o projeto Expo ficar alinhado com a TWA. Não gere nem envie um binário Android por aqui: a Play Store continua na TWA atual.

## O que o shell faz

- Splash nativa (`expo-splash-screen`) com a esfera estática em fundo branco, no mesmo tom da splash da PWA.
- Em seguida, a intro em React Native (Reanimated): a esfera entra girando, fica em loop com “Poliweb” e some em fade quando o site termina de montar. O fundo permanece branco, então o WebView não aparece em branco no meio.
- WebView em tela cheia, com a status bar na cor `#1976D2` e a home indicator respeitada pela tab bar.
- Tab bar nativa: Início, Categorias, Cidades, Buscar e Perfil, nas rotas que o site já usa (`/`, `/encontre`, `/cidades`, `/buscar`, `/perfil`). A navbar flutuante do site é escondida para não ficar duplicada. Perfil entra na tab bar porque já é atalho do manifest e dá uma navegação nativa além do site.
- Pull-to-refresh, gesto de voltar no iOS e botão voltar no Android.
- WhatsApp, `tel:`, `mailto:`, mapas e outros domínios abrem fora do WebView (`Linking` ou `expo-web-browser`). Iframes da própria página (anúncio, reCAPTCHA, mapa embutido) continuam dentro.
- Tela offline com “Tentar de novo”.
- Câmera, fotos e microfone declarados para os `<input type="file">` do site (logo, galeria e vídeo do comércio).

Isso é o mínimo de chrome nativo para o app não ser só um site na revisão da diretriz 4.2.

## Pré-requisitos

- Node.js 22 ou mais novo
- Conta Expo
- Conta Apple Developer Individual do time `Y6FSFUALV7`, com acesso ao app `1659657349`

Os comandos abaixo rodam **dentro de `mobile/`**. Não rode o EAS na raiz do repositório Quasar.

```bash
cd mobile
npm install
```

## Rodar localmente

Não há simulador de iOS neste ambiente Linux. No Mac, o Expo Go não reproduz a splash nativa configurada no plugin; para isso use um development build. No navegador, a intro e o site abrem numa coluna estreita. O `react-native-webview` não tem renderer web, então essa prévia usa um iframe. O binário iOS usa o WebView nativo.

```bash
npx expo start --web
```

No Mac, com Xcode:

```bash
npx expo start
# tecla i abre o simulador, depois de um development build (abaixo)
```

Checagens:

```bash
npx tsc --noEmit
node --experimental-strip-types --test src/navigationPolicy.test.ts
```

## Vincular o projeto Expo

O repositório ainda não tem `extra.eas.projectId`. Na primeira vez:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

O `eas init` grava o project id em `app.json`. Confirme o slug `poliweb-agenda` (ou aceite o projeto já existente da conta, se houver).

## Build number

`ios.buildNumber` está `"2"` e `android.versionCode` está `2`. Os perfis `development`, `preview` e `production` usam `autoIncrement` com `appVersionSource: "remote"`.

A EAS soma 1 na primeira build se o contador remoto ainda não existir. Com o `"2"` local, essa primeira build sairia como **3**. O build já publicado na App Store é o **1**, então inicialize o remoto com esse último número **antes** do primeiro `eas build`:

```bash
npx eas-cli@latest build:version:set -p ios
```

Quando pedir o valor, informe `1`. A próxima build iOS sai como `2`.

O Android deste projeto não vai para a Play Store. Se algum dia for preciso o mesmo contador:

```bash
npx eas-cli@latest build:version:set -p android
```

e informe `1` também.

## Builds

Não rode estes comandos da raiz do repo.

Development (simulador iOS, dev client, distribuição interna):

```bash
npx eas-cli@latest build --profile development --platform ios
```

Preview (dispositivo, distribuição interna / ad hoc). Na conta Individual é preciso ter o aparelho registrado no portal Apple:

```bash
npx eas-cli@latest build --profile preview --platform ios
```

Production (App Store):

```bash
npx eas-cli@latest build --profile production --platform ios
```

Envio para o app já publicado. O `eas.json` leva o ASC App ID `1659657349` e o Team ID `Y6FSFUALV7`. A CLI pede o Apple ID na primeira vez e guarda a credencial na Expo.

```bash
npx eas-cli@latest submit --profile production --platform ios
```

Não use `--platform android` nem `eas submit -p android`. Isso apontaria para o pacote da TWA que já está na Play Store.

## Ícone

`assets/icon.png` é o ícone novo da esfera (`public/icons/icon-1024x1024.png`), em 1024×1024, PNG RGB, sem canal alpha, que é o formato que a Apple exige. A splash usa a mesma esfera com fundo transparente em cima do branco (`assets/splash-icon.png`).
