import assert from "node:assert/strict";
import { test } from "node:test";

import {
  classifyNavigation,
  notificationUrl,
  tabForPath,
} from "./navigationPolicy.ts";

test("o site do Poliweb fica no WebView", () => {
  assert.equal(
    classifyNavigation("https://www.poliwebapp.com.br/"),
    "allow",
  );
  assert.equal(
    classifyNavigation("https://www.poliwebapp.com.br/comercio/12/padaria"),
    "allow",
  );
  assert.equal(
    classifyNavigation("https://apiv3.poliwebapp.com.br/customers/login"),
    "allow",
  );
});

test("WhatsApp, telefone, e-mail e mapas saem do app", () => {
  assert.equal(classifyNavigation("https://wa.me/5511999999999"), "system");
  assert.equal(
    classifyNavigation("https://api.whatsapp.com/send?text=Ola", false),
    "system",
  );
  assert.equal(classifyNavigation("whatsapp://send?text=Ola"), "system");
  assert.equal(classifyNavigation("tel:+5511999999999"), "system");
  assert.equal(classifyNavigation("mailto:contato@poliwebapp.com.br"), "system");
  assert.equal(
    classifyNavigation("https://maps.google.com/maps?q=Padaria"),
    "system",
  );
  assert.equal(
    classifyNavigation("https://maps.apple.com/?q=Rua%20A"),
    "system",
  );
  assert.equal(
    classifyNavigation("https://www.google.com/maps/search/?api=1&query=Padaria"),
    "system",
  );
});

test("mapa embutido e iframes de anúncio continuam na página", () => {
  assert.equal(
    classifyNavigation(
      "https://maps.google.com/maps?q=Padaria&output=embed",
      false,
    ),
    "allow",
  );
  assert.equal(
    classifyNavigation("https://pagead2.googlesyndication.com/pagead/js/ads", false),
    "allow",
  );
});

test("outro domínio em navegação principal abre no navegador", () => {
  assert.equal(classifyNavigation("https://example.com/promo"), "browser");
  assert.equal(
    classifyNavigation("https://evilpoliwebapp.com.br/"),
    "browser",
  );
});

test("abas seguem as rotas do site", () => {
  assert.equal(tabForPath("/"), "home");
  assert.equal(tabForPath("/home"), "home");
  assert.equal(tabForPath("/encontre"), "categories");
  assert.equal(tabForPath("/categorias/3/padaria"), "categories");
  assert.equal(tabForPath("/cidades"), "cities");
  assert.equal(tabForPath("/cidade/campinas"), "cities");
  assert.equal(tabForPath("/buscar/padaria"), "search");
  assert.equal(tabForPath("/perfil"), "profile");
  assert.equal(tabForPath("/comercio/9/loja"), null);
});

test("o toque na notificação só abre URL do Poliweb", () => {
  assert.equal(
    notificationUrl({ path: "/buscar" }),
    "https://www.poliwebapp.com.br/buscar",
  );
  assert.equal(
    notificationUrl({ url: "https://www.poliwebapp.com.br/perfil" }),
    "https://www.poliwebapp.com.br/perfil",
  );
  assert.equal(notificationUrl({ url: "https://example.com" }), null);
  assert.equal(notificationUrl(undefined), null);
});
