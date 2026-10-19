# Poliweb error reporting

The projects `poliweb-frontend`, `poliweb-backend`, and `poliweb-mobile` live in the existing Sentry organization `agora-passei`. The available VPS credentials belong to that organization; they cannot read the older Poliweb organization. Existing events in the older projects have not been migrated.

Only the public DSNs belong in the source. `SENTRY_AUTH_TOKEN` is a secret in the Expo production environment and stays out of the app bundle and Git.

## What was verified on 2026-10-19

- The existing SSR home throws `ReferenceError: window is not defined` when rendered on the server. The PWA install listeners ran in Vue's `created` hook. Moving them to `beforeMount` removes that server execution. The corrected home, cities, and commerce routes returned HTTP 200 without that exception.
- Server-side Axios failures must not enter browser refresh-token logic.
- The App Store listing for version 1.0.2 supports iOS 16.4+. The previous Browserslist configuration selected iOS 18+. The web build now explicitly includes iOS/Safari 16.4+.
- The mobile shell did not handle WebKit content-process termination. It now reports termination and remounts at the current first-party URL, at most twice per minute, then exposes manual retry.
- The injected script previously installed duplicate observers and retained observers after readiness. It now installs once per document and disconnects after readiness, timeout, or page exit.
- Push permission/registration failures are caught and reported rather than becoming unhandled promise rejections.
- The backend controllers catch their own exceptions and return 5xx responses. Those exceptions bypass Fastify's `onError` handler. The backend patch captures the original exceptions in those catch blocks and excludes expected 4xx `HttpError`s.

These observations do **not** establish which failure closed an affected iPhone. Native crash telemetry from the instrumented build, or an Apple crash report from that device, is required to establish that cause. A WebKit process termination also does not necessarily mean the whole app crashed.

## Builds and symbols

Run mobile commands inside `mobile/`:

```sh
npm ci
npx tsc --noEmit
node --experimental-strip-types --test src/*.test.ts
npx expo export --platform ios --source-maps
eas build --profile production --platform ios
```

The Sentry Expo plugin uploads JavaScript maps and native symbols during EAS Build. `SENTRY_AUTH_TOKEN` must exist in the selected EAS environment before the build starts. New native builds are required to instrument installations that predate the native SDK; this is not a web-only update.

For the web, source maps are opt-in and hidden:

```sh
SENTRY_SOURCEMAPS=1 npm run build
npx @sentry/cli sourcemaps upload --org agora-passei --project poliweb-frontend --release poliweb-web@2026.10.19 --url-prefix '~/' dist/pwa
```

Keep the maps privately for retry if Sentry is unavailable, and remove `.map` files from the public deployment. The release passed to the upload must match the `SENTRY_RELEASE` compiled into the web build. Bump that release for later deployments.

During verification, Sentry's ingest endpoint accepted diagnostic events with HTTP 200, while its management API intermittently timed out or returned HTTP 429. Successful ingestion alone does not verify that an event is indexed or symbolicated; verify both in the project after API service recovers.
