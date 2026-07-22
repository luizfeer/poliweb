import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type CsvImportDialogProps = {
  title: string;
  cityId: string;
  action: (formData: FormData) => Promise<void>;
  placeholder: string;
};

export function CsvImportDialog({ title, cityId, action, placeholder }: CsvImportDialogProps) {
  return (
    <form action={action} className="space-y-3 rounded-2xl border bg-card p-5">
      <input type="hidden" name="city_id" value={cityId} />
      <div>
        <h2 className="font-sans text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">Cole CSV com cabeçalho na primeira linha.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${title}-csv`}>CSV</Label>
        <textarea
          id={`${title}-csv`}
          name="csv"
          rows={5}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder={placeholder}
          required
        />
      </div>
      <Button type="submit">Importar CSV</Button>
    </form>
  );
}
