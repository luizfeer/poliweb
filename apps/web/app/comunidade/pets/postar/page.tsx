import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { submitLostPetAction } from '@/lib/community/actions';
import { MaskedInput } from '@/components/public/forms/masked-input';
import { PostingTip } from '@/components/public/forms/posting-tip';

export const metadata = { title: 'Postar pet - Carmo Local' };

export default async function PostPetPage() {
  await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <p className="text-muted-foreground text-sm">Comunidade</p>
        <h1 className="text-3xl font-bold">Postar pet perdido ou encontrado</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Informe os dados que ajudam alguém a reconhecer o animal. O anúncio passa por moderação
          antes de aparecer.
        </p>
      </header>
      <PostingTip title="O que vai aparecer no anúncio">
        <p>
          Pense como um cartaz de ajuda: foto, local onde foi visto, características marcantes e um
          contato rápido. Evite endereço completo; ponto de referência e bairro costumam bastar.
        </p>
      </PostingTip>
      <form
        action={submitLostPetAction}
        className="bg-card grid gap-6 rounded-xl border p-5 shadow-sm"
      >
        <input type="hidden" name="city_id" value={city.id} />
        <label className="grid gap-1 text-sm font-medium">
          Situação
          <select name="status" className="bg-background rounded-md border px-3 py-2">
            <option value="lost">Perdido</option>
            <option value="found">Encontrado</option>
          </select>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome do pet" name="pet_name" placeholder="Se souber" />
          <Field label="Espécie" name="species" required placeholder="Cachorro, gato..." />
          <Field label="Raça" name="breed" placeholder="SRD, pinscher, siamês..." />
          <Field label="Cor" name="color" placeholder="Caramelo, preto com branco..." />
          <Field label="Porte" name="size" placeholder="Pequeno, médio ou grande" />
          <Field label="Visto em" name="last_seen_at" type="datetime-local" />
        </div>
        <Field
          label="Local onde foi visto"
          name="last_seen_location"
          placeholder="Rua, bairro ou ponto de referência"
        />
        <label className="grid gap-1 text-sm font-medium">
          Descrição
          <textarea
            name="description"
            rows={5}
            required
            placeholder="Conte sinais marcantes, coleira, comportamento e qualquer detalhe útil."
            className="bg-background rounded-md border px-3 py-2"
          />
        </label>
        <Field label="Nome de contato" name="contact_name" required />
        <div className="grid gap-4 md:grid-cols-2">
          <PhoneField label="Telefone" name="contact_phone" required />
          <PhoneField label="WhatsApp" name="contact_whatsapp" />
        </div>
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

function PhoneField({
  label,
  name,
  required = false,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <MaskedInput
        name={name}
        mask="phone"
        required={required}
        placeholder="(35) 99999-9999"
        className="bg-background rounded-md border px-3 py-2"
      />
    </label>
  );
}
