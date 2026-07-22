'use client';

import { useMemo, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { MediaFileInput } from '@/components/admin/media/media-file-input';
import { PublicationSafetyAgreement } from '@/components/admin/publication-safety-agreement';
import { MaskedInput } from '@/components/public/forms/masked-input';
import type { ClassifiedType } from '@/lib/classifieds/types';
import { createClassifiedDraftAction } from '../actions';

type ClassifiedDraftFormProps = {
  cityId: string;
};

const typeOptions: Array<{ value: ClassifiedType; label: string; hint: string; tip: string }> = [
  {
    value: 'item',
    label: 'Item',
    hint: 'Venda, troca ou doação',
    tip: 'Mostre estado, marca, motivo da venda, preço e se aceita troca. Foto clara ajuda muito.',
  },
  {
    value: 'vehicle',
    label: 'Veículo',
    hint: 'Carro, moto, barco',
    tip: 'Informe modelo, ano, quilometragem, combustível, câmbio e detalhes de conservação.',
  },
  {
    value: 'service',
    label: 'Serviço',
    hint: 'Profissional autônomo',
    tip: 'Explique o que você faz, onde atende, faixa de preço e como o cliente pode chamar.',
  },
  {
    value: 'job',
    label: 'Vaga',
    hint: 'Oportunidade de trabalho',
    tip: 'Deixe claro função, horário, contrato, salário ou faixa, benefícios e como se candidatar.',
  },
  {
    value: 'other',
    label: 'Outro',
    hint: 'Algo fora das opções',
    tip: 'Use quando nenhuma categoria encaixa. Escreva o contexto e o próximo passo esperado.',
  },
];

export function ClassifiedDraftForm({ cityId }: ClassifiedDraftFormProps) {
  const [type, setType] = useState<ClassifiedType>('item');
  const selected = useMemo(() => typeOptions.find((option) => option.value === type), [type]);

  return (
    <SubmitOnceForm
      action={createClassifiedDraftAction}
      className="bg-card grid gap-6 rounded-xl border p-5 shadow-sm"
    >
      <input type="hidden" name="city_id" value={cityId} />

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Tipo de anúncio</h2>
        <div className="grid gap-2 md:grid-cols-5">
          {typeOptions.map((option) => (
            <label
              key={option.value}
              className="bg-background has-[:checked]:border-primary has-[:checked]:bg-primary/5 cursor-pointer rounded-lg border p-3 text-sm"
            >
              <input
                className="sr-only"
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
              />
              <span className="block font-semibold">{option.label}</span>
              <span className="text-muted-foreground mt-1 block text-xs">{option.hint}</span>
            </label>
          ))}
        </div>
        <div className="border-primary/20 bg-primary/5 rounded-lg border p-3 text-sm">
          <p className="font-medium">Dica para {selected?.label.toLowerCase()}</p>
          <p className="text-muted-foreground mt-1">{selected?.tip}</p>
        </div>
      </section>

      <Section title="Dados principais">
        <Field label="Título" name="title" required placeholder="Ex: Bicicleta aro 29 seminova" />
        <Field
          label="Categoria"
          name="category_label"
          placeholder="Móveis, eletrônicos, diarista..."
        />
        <label className="grid gap-1 text-sm font-medium">
          Preço
          <MaskedInput
            name="price"
            mask="currency"
            placeholder="R$ 0,00"
            className="bg-background rounded-md border px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          Descrição
          <textarea
            name="description"
            rows={5}
            placeholder="Descreva estado, medidas, detalhes importantes e condições."
            className="bg-background rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_negotiable" />
          Aceita negociação
        </label>
      </Section>

      {type === 'vehicle' ? (
        <Section title="Dados do veículo">
          <Field label="Marca" name="marca" required />
          <Field label="Modelo" name="modelo" required />
          <Field label="Ano modelo" name="ano_modelo" type="number" placeholder="2020" />
          <Field label="Ano fabricação" name="ano_fabricacao" type="number" placeholder="2019" />
          <Field label="Quilometragem" name="km" type="number" placeholder="85000" />
          <Field label="Combustível" name="combustivel" placeholder="Flex, gasolina..." />
          <Field label="Câmbio" name="cambio" placeholder="Manual ou automático" />
          <Field label="Cor" name="cor" />
          <Field label="Final da placa" name="placa_final" maxLength={1} inputMode="numeric" />
        </Section>
      ) : null}

      {type === 'job' ? (
        <Section title="Dados da vaga">
          <SelectField label="Contrato" name="tipo" defaultValue="clt">
            <option value="clt">CLT</option>
            <option value="pj">PJ</option>
            <option value="temporario">Temporário</option>
          </SelectField>
          <SelectField label="Modalidade" name="modalidade" defaultValue="presencial">
            <option value="presencial">Presencial</option>
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
          </SelectField>
          <Field
            label="Faixa salarial"
            name="faixa_salarial"
            placeholder="Ex: R$ 1.800 a R$ 2.200"
          />
          <Field label="Benefícios" name="beneficios" placeholder="Vale transporte, almoço..." />
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            Requisitos
            <textarea
              name="requisitos"
              rows={3}
              className="bg-background rounded-md border px-3 py-2"
            />
          </label>
        </Section>
      ) : null}

      {type === 'service' ? (
        <Section title="Dados do serviço">
          <Field
            label="Área de atuação"
            name="area_atuacao"
            required
            placeholder="Jardinagem, elétrica, aulas..."
          />
          <Field label="Raio de atendimento em km" name="raio_atendimento_km" type="number" />
          <Field
            label="Faixa de preço"
            name="faixa_preco"
            placeholder="A combinar, a partir de R$ 80..."
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="atende_em_casa" />
            Atende em casa
          </label>
        </Section>
      ) : null}

      {type === 'item' ? (
        <Section title="Dados do item">
          <SelectField label="Condição" name="condicao" defaultValue="usado">
            <option value="usado">Usado</option>
            <option value="seminovo">Seminovo</option>
            <option value="novo">Novo</option>
          </SelectField>
          <Field label="Marca" name="item_marca" />
          <Field label="Motivo da venda" name="motivo_venda" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="aceita_troca" />
            Aceita troca
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_free_item" />É doação
          </label>
        </Section>
      ) : null}

      <Section title="Contato e mídia">
        <Field
          label="Nome de contato"
          name="contact_name"
          placeholder="Como deve aparecer no anúncio"
        />
        <PhoneField label="Telefone" name="contact_phone" required />
        <PhoneField label="WhatsApp" name="contact_whatsapp" />
        <div className="md:col-span-2">
          <MediaFileInput
            name="cover_file"
            label="Foto de capa"
            helpText="Escolha a melhor foto para aparecer na vitrine. Use imagem horizontal quando possível."
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
          />
        </div>
        <div className="md:col-span-2">
          <MediaFileInput
            name="gallery_files"
            label="Galeria de fotos e vídeos"
            helpText="Adicione detalhes, ângulos, funcionamento ou estado real. Vídeos curtos ajudam bastante no celular."
            multiple
          />
        </div>
        <input type="hidden" name="cover_url" value="" />
      </Section>

      <PublicationSafetyAgreement />

      <div className="sticky bottom-3 z-10 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur">
        <SubmitOnceButton
          label="Salvar rascunho"
          pendingLabel="Salvando e enviando mídia..."
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-75"
        />
      </div>
    </SubmitOnceForm>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t pt-5 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, className, ...inputProps } = props;
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input {...inputProps} className={className ?? 'bg-background rounded-md border px-3 py-2'} />
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

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="bg-background rounded-md border px-3 py-2"
      >
        {children}
      </select>
    </label>
  );
}
