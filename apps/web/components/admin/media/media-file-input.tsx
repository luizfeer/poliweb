'use client';

import { ImagePlus, Play, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

type PreviewItem = {
  id: string;
  name: string;
  url: string;
  isVideo: boolean;
};

type MediaFileInputProps = {
  name: string;
  label: string;
  helpText: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
};

const DEFAULT_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/quicktime,video/webm';

export function MediaFileInput({
  name,
  label,
  helpText,
  accept = DEFAULT_ACCEPT,
  multiple = false,
  required = false,
}: MediaFileInputProps) {
  const inputId = useId();
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    const files = Array.from(event.target.files ?? []);
    setPreviews(
      files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        name: file.name,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video/'),
      })),
    );
  }

  function clearFiles() {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (input) input.value = '';
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setPreviews([]);
  }

  return (
    <div className="grid gap-3">
      <label
        htmlFor={inputId}
        className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-paper px-4 py-5 text-center text-muted-foreground transition-colors hover:border-primary/50 hover:bg-clay-50 hover:text-primary"
      >
        <ImagePlus className="h-8 w-8" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="max-w-sm text-xs leading-relaxed">{helpText}</span>
        <input
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          required={required}
          className="sr-only"
          onChange={handleChange}
        />
      </label>

      {previews.length > 0 ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              {previews.length} arquivo{previews.length === 1 ? '' : 's'} selecionado
              {previews.length === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              onClick={clearFiles}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Limpar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {previews.map((item) => (
              <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                {item.isVideo ? (
                  <>
                    <video src={item.url} className="h-full w-full object-cover" muted playsInline />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                      <Play className="h-7 w-7 fill-white" aria-hidden="true" />
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
