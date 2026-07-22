import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { submitEventAction } from '@/lib/community/actions';
import { listEventCategories } from '@/lib/community/queries';
import { PostingTip } from '@/components/public/forms/posting-tip';

export const metadata = { title: 'Enviar evento - Carmo Local' };

export default async function SubmitEventPage() {
  await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('events')) notFound();
  const categories = await listEventCategories(city.id);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <p className="text-muted-foreground text-sm">Agenda</p>
        <h1 className="text-3xl font-bold">Enviar evento</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          O evento entra como pendente e passa por moderação antes de aparecer.
        </p>
      </header>
      <PostingTip title="Como deixar o evento fácil de entender">
        <p>
          A postagem vira uma ficha na agenda da cidade. Informe quando começa, onde acontece, quem
          organiza e se precisa de inscrição. Na descrição, escreva para alguém decidir rapidamente
          se vale a pena ir.
        </p>
      </PostingTip>
      <form
        action={submitEventAction}
        className="bg-card grid gap-6 rounded-xl border p-5 shadow-sm"
      >
        <input type="hidden" name="city_id" value={city.id} />
        <Field
          label="Título"
          name="title"
          required
          placeholder="Ex: Festa de São João no bairro..."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Início" name="start_at" type="datetime-local" required />
          <Field label="Fim" name="end_at" type="datetime-local" />
        </div>
        <Field label="Local" name="location" />
        <label className="grid gap-1 text-sm font-medium">
          Categoria
          <select name="category_id" className="bg-background rounded-md border px-3 py-2">
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Descrição
          <textarea
            name="description"
            rows={5}
            placeholder="Conte o que vai acontecer, para quem é indicado e informações importantes."
            className="bg-background rounded-md border px-3 py-2"
          />
        </label>
        <Field label="Organizador" name="organizer_name" />
        <Field
          label="Link de inscrição ou ingresso"
          name="ticket_url"
          type="url"
          placeholder="https://..."
        />
        <label className="grid gap-1 text-sm font-medium">
          Imagem de capa
          <input
            name="cover_file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="bg-background rounded-md border px-3 py-2"
          />
        </label>
        <input type="hidden" name="cover_url" value="" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_free" defaultChecked />
          Evento gratuito
        </label>
        <button type="submit" className="bg-primary text-primary-foreground rounded-md px-4 py-2">
          Enviar para moderação
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="bg-background rounded-md border px-3 py-2"
      />
    </label>
  );
}
