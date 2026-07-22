import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { submitLostAndFoundAction } from '@/lib/community/actions';
import { MaskedInput } from '@/components/public/forms/masked-input';
import { PostingTip } from '@/components/public/forms/posting-tip';

export const metadata = { title: 'Postar achado ou perdido - Carmo Local' };

export default async function PostLostAndFoundPage() {
  await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <p className="text-muted-foreground text-sm">Comunidade</p>
        <h1 className="text-3xl font-bold">Postar achado ou perdido</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Publique com poucos dados e evite expor informações sensíveis. O post passa por moderação.
        </p>
      </header>
      <PostingTip title="O que é essa postagem">
        <p>
          Ela funciona como um aviso público para aproximar quem perdeu e quem encontrou. Descreva o
          item sem revelar dados sensíveis, como número de documento, senha, endereço completo ou
          informações pessoais de terceiros.
        </p>
      </PostingTip>
      <form
        action={submitLostAndFoundAction}
        className="bg-card grid gap-6 rounded-xl border p-5 shadow-sm"
      >
        <input type="hidden" name="city_id" value={city.id} />
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select name="type" className="bg-background rounded-md border px-3 py-2">
            <option value="lost">Perdi</option>
            <option value="found">Encontrei</option>
          </select>
        </label>
        <Field
          label="Descrição do item"
          name="item_description"
          required
          placeholder="Ex: chave com chaveiro azul, carteira preta..."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Categoria" name="category" placeholder="Documento, chave, celular..." />
          <Field label="Data aproximada" name="occurred_at" type="datetime-local" />
        </div>
        <Field label="Local" name="location" placeholder="Bairro, rua ou ponto de referência" />
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
