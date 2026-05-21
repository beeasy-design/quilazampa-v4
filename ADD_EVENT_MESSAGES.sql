-- Aggiungi tabella messaggi chat di gruppo eventi
create table if not exists event_messages (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table event_messages enable row level security;

drop policy if exists "Tutti vedono messaggi evento" on event_messages;
drop policy if exists "Partecipanti inviano messaggi" on event_messages;

create policy "Tutti vedono messaggi evento" on event_messages for select using (true);
create policy "Utenti inviano messaggi evento" on event_messages for insert with check (auth.uid() = user_id);

select 'Tabella event_messages creata!' as status;
