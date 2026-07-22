'use client';

import { useActionState } from 'react';
import type { ReactNode } from 'react';
import type { CommunityGroup } from '@/lib/community/types';
import {
  COMMUNITY_GROUP_CATEGORY_OPTIONS,
  COMMUNITY_GROUP_TYPE_OPTIONS,
} from '@/lib/community/types';
import {
  upsertCommunityGroupFormAction,
  upsertCommunityGroupPostAction,
} from '@/lib/community/actions';
import type { CommunityGroupFormState } from '@/lib/community/actions';
import type { CommunityGroupPost } from '@/lib/community/types';
import { MaskedInput } from '@/components/public/forms/masked-input';
import { FeaturePurchaseDialog } from '@/components/community/feature-purchase-dialog';

type CommunityGroupEditorProps = {
  cityId: string;
  group?: CommunityGroup | null;
  posts?: CommunityGroupPost[];
  buyerFullName?: string | null;
  buyerPhone?: string | null;
  /** Quais seções exibir. Default mostra tudo (compat). */
  mode?: 'edit' | 'post' | 'all';
};

export function CommunityGroupEditor({
  cityId,
  group,
  posts = [],
  buyerFullName,
  buyerPhone,
  mode = 'all',
}: CommunityGroupEditorProps) {
  const showEditForm = mode === 'edit' || mode === 'all';
  const showFeaturedCard = mode === 'all';
  const showPostForm = mode === 'post' || mode === 'all';
  const [state, formAction, pending] = useActionState<CommunityGroupFormState, FormData>(
    upsertCommunityGroupFormAction,
    {},
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="space-y-6">
      {showEditForm ? (
      <form
        id="editar-grupo"
        action={formAction}
        className="bg-card grid gap-6 rounded-xl border p-5 shadow-sm"
      >
        {group ? <input type="hidden" name="id" value={group.id} /> : null}
        <input type="hidden" name="city_id" value={cityId} />

        {state.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold">Editar dados do grupo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece pelo que aparece para todo mundo. O restante fica em configurações avançadas.
            </p>
          </div>

        <Field
          label="Nome do grupo"
          name="name"
          required
          defaultValue={group?.name}
          placeholder="Ex: Mães do Bairro do Rosário"
          hint="A página pública será criada automaticamente a partir do nome."
          error={fieldErrors.name}
        />
          {group ? <input type="hidden" name="slug" value={group.slug} /> : null}

          <FileField
            label="Foto do grupo"
            name="thumb_file"
            hint="Imagem quadrada ou logo que aparece nas listagens."
          />

          <Field
            label="WhatsApp"
            name="contact_whatsapp"
            defaultValue={group?.contactWhatsapp ?? undefined}
            mask="phone"
            placeholder="(35) 99999-9999"
            hint="Contato principal exibido para quem quer falar com o grupo."
            error={fieldErrors.contact_whatsapp}
          />

          <TextArea
            label="Regras do grupo"
            name="group_rules"
            rows={4}
            defaultValue={group?.groupRules}
            hint="Combine aqui o que pode ou não pode no grupo."
            error={fieldErrors.group_rules}
          />

          <TextArea
            label="Descrição"
            name="description"
            rows={6}
            defaultValue={group?.description}
            placeholder="Conte o objetivo do grupo, quem participa e que tipo de assunto costuma ser tratado."
            hint="Texto principal da página pública do grupo."
            error={fieldErrors.description}
          />
        </section>

        <details open={Boolean(state.error)} className="group rounded-xl border bg-background/60 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
            Configurações avançadas
            <span className="text-xs text-muted-foreground group-open:hidden">Expandir</span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">Recolher</span>
          </summary>

          <div className="mt-5 grid gap-5">

        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Tipo" name="type" defaultValue={group?.type ?? 'collective'}>
            {COMMUNITY_GROUP_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Categoria" name="category" defaultValue={group?.category ?? 'avisos'}>
            {COMMUNITY_GROUP_CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectField>
          <Field
            label="Bairro ou região"
            name="neighborhood"
            defaultValue={group?.neighborhood ?? undefined}
            placeholder="Centro, Vilelândia..."
          />
        </div>

        <TextArea
          label="Resumo"
          name="short_description"
          rows={3}
          defaultValue={group?.shortDescription}
          maxLength={180}
          placeholder="Uma frase curta para aparecer nos cards."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Contato principal"
            name="contact_name"
            defaultValue={group?.contactName ?? undefined}
          />
          <Field
            label="Telefone"
            name="contact_phone"
            defaultValue={group?.contactPhone ?? undefined}
            mask="phone"
            placeholder="(35) 99999-9999"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Email"
            name="contact_email"
            type="email"
            defaultValue={group?.contactEmail ?? undefined}
          />
          <Field
            label="Instagram"
            name="instagram_url"
            type="url"
            defaultValue={group?.instagramUrl ?? undefined}
          />
          <Field
            label="Site"
            name="website_url"
            type="url"
            defaultValue={group?.websiteUrl ?? undefined}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Link de convite do WhatsApp"
            name="whatsapp_invite_url"
            type="url"
            defaultValue={group?.whatsappInviteUrl ?? undefined}
            placeholder="https://chat.whatsapp.com/..."
          />
          <Field
            label="Estimativa de pessoas"
            name="member_estimate"
            type="number"
            defaultValue={group?.memberEstimate?.toString()}
          />
          <Field
            label="Última conferência do link"
            name="last_verified_at"
            type="datetime-local"
            defaultValue={toLocalInput(group?.lastVerifiedAt)}
          />
        </div>

        <TextArea
          label="Como participar"
          name="participation_instructions"
          rows={4}
          defaultValue={group?.participationInstructions}
        />
        <div className="grid gap-4">
          <FileField label="Capa" name="cover_file" />
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <CheckField label="Grupo oficial" name="is_official" defaultChecked={group?.isOfficial} />
          <CheckField
            label="Entrada depende de aprovação"
            name="requires_approval"
            defaultChecked={group?.requiresApproval}
          />
        </div>

        {group ? (
          <SelectField label="Status" name="status" defaultValue={group.status}>
            <option value="draft">draft</option>
            <option value="pending">pending</option>
            <option value="published">published</option>
            <option value="rejected">rejected</option>
            <option value="archived">archived</option>
          </SelectField>
        ) : null}

          </div>
        </details>

        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 disabled:opacity-60"
        >
          {pending ? 'Salvando...' : group ? 'Salvar grupo' : 'Cadastrar grupo'}
        </button>
      </form>
      ) : null}

      {showFeaturedCard && group ? (
        <section className="rounded-xl border border-cerrado-200 bg-cerrado-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-cerrado-700">Impulsionar grupo</p>
              <h2 className="mt-1 text-xl font-semibold text-ink-900">Destaque da Comunidade</h2>
              <p className="mt-2 text-sm text-ink-700">
                Mais visibilidade por 30 dias: prioridade no diretório, possibilidade de aparecer
                na home da cidade e selo de destaque enquanto a campanha estiver ativa.
              </p>
              <p className="mt-3 text-sm font-semibold text-ink-900">
                R$ 49,90 por 30 dias
              </p>
            </div>
            <FeaturePurchaseDialog
              cityId={cityId}
              targetType="community_group"
              targetId={group.id}
              targetTitle={group.name}
              planSlug="destaque-30d"
              amountCents={4900}
              durationDays={30}
              defaultFullName={buyerFullName ?? undefined}
              defaultPhone={buyerPhone ?? undefined}
              currentFeaturedUntil={group.featuredUntil}
            />
          </div>
        </section>
      ) : null}

      {showPostForm && group ? (
        <section id="publicar-postagem" className="space-y-6 rounded-xl border bg-card p-5 shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground">Postagens</p>
            <h2 className="text-xl font-semibold">Publicar no grupo</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Avisos, pedidos, oportunidades e comunicados que aparecem na página pública.
            </p>
          </div>

          <form action={upsertCommunityGroupPostAction} className="grid gap-5 border-t pt-5">
            <input type="hidden" name="city_id" value={cityId} />
            <input type="hidden" name="group_id" value={group.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Título"
                name="title"
                required
                hint="Frase curta que resume o comunicado."
              />
              <SelectField
                label="Tipo de postagem"
                name="post_type"
                defaultValue="notice"
                hint="Ajuda a organizar a postagem para quem acompanha o grupo."
              >
                <option value="notice">Aviso</option>
                <option value="request">Pedido</option>
                <option value="donation">Doação</option>
                <option value="opportunity">Oportunidade</option>
                <option value="announcement">Comunicado</option>
                <option value="lost_found">Achado ou perdido</option>
              </SelectField>
            </div>

            <TextArea
              label="Texto"
              name="body"
              rows={5}
              hint="Explique o que aconteceu, para quem serve e o que a pessoa deve fazer."
            />
            <FileField
              label="Imagem da postagem"
              name="image_file"
              hint="Opcional. Use quando a imagem ajuda a identificar o aviso."
            />

            <details className="group rounded-xl border bg-background/60 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                Configurações avançadas da postagem
                <span className="text-xs text-muted-foreground group-open:hidden">Expandir</span>
                <span className="hidden text-xs text-muted-foreground group-open:inline">Recolher</span>
              </summary>

              <div className="mt-5 grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Início"
                    name="starts_at"
                    type="datetime-local"
                    hint="Use quando o aviso tem data ou horário para começar."
                  />
                  <Field
                    label="Fim"
                    name="ends_at"
                    type="datetime-local"
                    hint="Use quando a postagem deixa de valer em uma data específica."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Telefone de contato"
                    name="contact_phone"
                    mask="phone"
                    placeholder="(35) 99999-9999"
                    hint="Número para quem não usa WhatsApp."
                  />
                  <Field
                    label="WhatsApp de contato"
                    name="contact_whatsapp"
                    mask="phone"
                    placeholder="(35) 99999-9999"
                    hint="Número para retorno direto sobre esta postagem."
                  />
                  <Field
                    label="Email de contato"
                    name="contact_email"
                    type="email"
                    hint="Use se a resposta deve ir para um email."
                  />
                </div>

                <Field
                  label="Link externo"
                  name="external_url"
                  type="url"
                  hint="Página, formulário ou arquivo com mais detalhes."
                />
              </div>
            </details>

            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
              Publicar postagem
            </button>
          </form>

          <div className="space-y-3 border-t pt-4">
            {posts.map((post) => (
              <article key={post.id} className="bg-background rounded-lg border p-4">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {post.postType}
                </p>
                <h3 className="mt-1 font-semibold">{post.title}</h3>
                {post.body ? (
                  <p className="text-muted-foreground mt-2 text-sm">{post.body}</p>
                ) : null}
                <p className="mt-2 text-sm">Status: {post.status}</p>
              </article>
            ))}
            {posts.length === 0 ? (
              <p className="bg-background text-muted-foreground rounded-lg border p-4 text-sm">
                Nenhuma postagem criada ainda.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
  type = 'text',
  placeholder,
  hint,
  mask,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  mask?: 'phone';
  error?: string;
}) {
  const inputClassName = `bg-background rounded-md border px-3 py-2 ${error ? 'border-destructive' : ''}`;

  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {mask ? (
        <MaskedInput
          name={name}
          mask={mask}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className={inputClassName}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className={inputClassName}
        />
      )}
      {hint ? <span className="text-muted-foreground text-xs font-normal">{hint}</span> : null}
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  name,
  rows,
  defaultValue,
  maxLength,
  placeholder,
  hint,
  error,
}: {
  label: string;
  name: string;
  rows: number;
  defaultValue?: string | null;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`bg-background rounded-md border px-3 py-2 ${error ? 'border-destructive' : ''}`}
      />
      {hint ? <span className="text-muted-foreground text-xs font-normal">{hint}</span> : null}
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
  hint,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className={`bg-background rounded-md border px-3 py-2 ${error ? 'border-destructive' : ''}`}
      >
        {children}
      </select>
      {hint ? <span className="text-muted-foreground text-xs font-normal">{hint}</span> : null}
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

function FileField({ label, name, hint }: { label: string; name: string; hint?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
        className="bg-background rounded-md border px-3 py-2"
      />
      {hint ? <span className="text-muted-foreground text-xs font-normal">{hint}</span> : null}
    </label>
  );
}

function CheckField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

function toLocalInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 16);
}
