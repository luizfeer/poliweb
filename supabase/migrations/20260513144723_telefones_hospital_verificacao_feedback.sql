-- Confirma numeros novos do Hospital Sao Vicente de Paulo divulgados em noticia local.
-- Fonte consultada em 2026-05-13: Carmo Web TV, 2025-03-26.

update public.emergency_contacts
set whatsapp = phone,
    needs_verification = false,
    source_type = 'noticia-local-confirmada',
    note = 'Numeros divulgados pela Carmo Web TV em 26/03/2025 como novos contatos do Hospital Sao Vicente de Paulo, com atendimento via WhatsApp.',
    last_verified_at = date '2026-05-13',
    updated_at = now()
where city_id = (select id from public.cities where slug = 'carmo-do-rio-claro')
  and category = 'saude'
  and name in (
    'Hospital São Vicente de Paulo - Pronto Atendimento',
    'Hospital São Vicente de Paulo - Portaria e Internações',
    'Hospital São Vicente de Paulo - Clínica'
  );

insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
select 'emergency_contact', id, city_id, 'upsert'
from public.emergency_contacts
where city_id = (select id from public.cities where slug = 'carmo-do-rio-claro')
  and category = 'saude'
  and name like 'Hospital São Vicente de Paulo%'
on conflict (entity_type, entity_id) do update
set operation = excluded.operation,
    city_id = excluded.city_id,
    processed_at = null,
    attempts = 0,
    last_error = null,
    enqueued_at = now();
