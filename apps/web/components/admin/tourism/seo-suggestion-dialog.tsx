import { Button } from '@/components/ui/button';

export function SeoSuggestionDialog({ id, entityType, action }: { id: string; entityType: string; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="rounded-2xl border bg-card p-5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="entity_type" value={entityType} />
      <input type="hidden" name="target" value={entityType === 'accommodation' ? 'short_description' : 'description'} />
      <h2 className="font-sans text-lg font-bold">SEO com IA</h2>
      <p className="mt-1 text-sm text-muted-foreground">Gera sugestão e registra em ai_jobs. A aplicação do texto continua manual.</p>
      <Button className="mt-3" type="submit" variant="secondary">Sugerir copy</Button>
    </form>
  );
}
