# Media Processor

Servico HTTP para rodar na VPS antes do Bunny Storage.

Ele recebe arquivos por `POST /v1/process`, comprime e normaliza:

- imagens para WebP;
- HEIC/HEIF quando o `sharp/libvips` do servidor tiver suporte a HEIF;
- videos para MP4 H.264/AAC via `ffmpeg`.

Depois envia o arquivo final para Bunny Storage e retorna metadados para o app web.

## Variaveis

Use `.env.example` como base.

`MEDIA_PROCESSOR_SECRET` deve ser igual no app web e na VPS.

No app web:

```env
MEDIA_PROCESSOR_URL=https://media.seudominio.com
MEDIA_PROCESSOR_SECRET=mesmo-segredo
```

## Deploy rapido

```bash
pnpm install --filter media-processor
pnpm --filter media-processor build
pnpm --filter media-processor start
```

Na VPS, instale `ffmpeg`:

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

Para HEIC/HEIF, valide suporte do `sharp` no servidor. Se o binario instalado nao tiver HEIF, instale libvips com HEIF ou rode via container com essa capacidade.
