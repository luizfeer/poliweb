# assets/

Substitua estes placeholders antes do primeiro build (originais em `original/`):

- `original/icon.png` — 1024×1024, sem transparência, sem cantos arredondados (iOS aplica máscara).
- `original/adaptive-icon.png` — 1024×1024, foreground com 60% da safe-zone (Android).
- `app-icon.webp` — gerado de `original/adaptive-icon.png` para UI in-app.
- `splash.png` — 1242×2436 ou maior, fundo `#FFFFFF`, logo centralizado.
- `notification-icon.png` — 96×96, branco sólido em alpha (Android).

Regenerar `app-icon.webp` (mobile):

```bash
node -e "require('sharp')('apps/mobile/assets/original/adaptive-icon.png').resize(128,128,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:82,alphaQuality:90}).toFile('apps/mobile/assets/app-icon.webp')"
```

(rodar a partir de `apps/media-processor`)
