create table public.system_settings (
  key text primary key,
  value text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.system_settings enable row level security;

-- Apenas administradores podem gerenciar configurações
create policy "Administrators can manage system settings"
  on public.system_settings
  for all
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Inserir ou atualizar a API Key (substitua 'SUA_CHAVE_AQUI' pela chave real caso já tenha)
-- INSERT INTO public.system_settings (key, value) VALUES ('gemini_api_key', 'SUA_CHAVE_AQUI') ON CONFLICT (key) DO NOTHING;
