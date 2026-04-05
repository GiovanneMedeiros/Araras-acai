alter table public.clients
add column if not exists phone_digits text;

update public.clients
set phone_digits = regexp_replace(coalesce(phone, ''), '\\D', '', 'g')
where phone_digits is null or phone_digits = '';

create unique index if not exists clients_phone_digits_unique_idx
on public.clients (phone_digits);

alter table public.clients
alter column phone_digits set not null;
