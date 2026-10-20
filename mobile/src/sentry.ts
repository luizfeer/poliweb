import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://a2502e461e9cbe0f5e831622565d5785@o4511888096493568.ingest.us.sentry.io/4512284726329344",
  environment: __DEV__ ? "development" : "production",
  enabled: !__DEV__,
  sendDefaultPii: false,
  attachStacktrace: true,
  tracesSampleRate: 0,
  beforeSend(event) {
    // Never send authentication headers, cookies, or form bodies from the site.
    if (event.request) {
      delete event.request.headers;
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.query_string;
      if (event.request.url) event.request.url = safePageUrl(event.request.url);
    }
    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.data) {
      for (const key of ["url", "from", "to"]) {
        if (typeof breadcrumb.data[key] === "string") {
          breadcrumb.data[key] = safePageUrl(breadcrumb.data[key]);
        }
      }
    }
    return breadcrumb;
  },
});

export function safePageUrl(value: string): string {
  return value.split(/[?#]/, 1)[0];
}

export function captureNativeError(error: unknown, phase: string): void {
  Sentry.withScope((scope) => {
    scope.setTag("poliweb.phase", phase);
    Sentry.captureException(error);
  });
}

Sentry.addBreadcrumb({ category: "app", message: "Poliweb shell starting" });

export { Sentry };
