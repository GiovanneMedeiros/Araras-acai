# Arara's Açaí - Fidelidade

Aplicacao React + Vite + Tailwind com area de cliente e painel administrativo protegido por Supabase Auth.

## Rotas

- /cliente: mini app mobile-first para consulta de pontos por telefone
- /admin/login: login administrativo com e-mail e senha
- /admin: painel administrativo protegido

Nao existe tela publica com atalho para admin.

## Arquitetura

```text
src/
  components/
    auth/
      RequireAdminAuth.jsx
    client/
      ...
    ui/
      ...
  constants/
    loyalty.js
  hooks/
    useAuth.jsx
  lib/
    supabase.js
  pages/
    AdminLogin.jsx
    AdminPortal.jsx
    ClientPortal.jsx
  services/
    authService.js
    clientsService.js
    purchasesService.js
    rewardsService.js
  utils/
    clientData.js
    format.js
    points.js
```

## Seguranca aplicada

- Auth real de admin via Supabase Auth
- Sessao persistente gerenciada pelo Supabase
- Checagem de autorizacao na tabela profiles (role = 'admin')
- Rota /admin protegida por guard
- Logout invalida sessao no Supabase
- Sem senha fixa no front-end

## Setup rapido

1. Instale dependencias:

```bash
npm install
```

2. Crie o arquivo .env baseado no .env.example:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_SUPABASE_ANON_KEY
```

3. No Supabase, execute o SQL de estrutura do projeto na pasta supabase.

4. Crie os usuarios admin no Supabase Auth (Dashboard -> Authentication -> Users).

5. Garanta que cada usuario admin possua profile com role = 'admin'.

6. Rode localmente:

```bash
npm run dev
```

## Modelo de dados (Supabase)

- profiles
  - id (UUID do auth.users)
  - role ('admin' para acesso administrativo)
- clients
  - name, phone, phone_digits, points, total_spent
- purchases
  - client_id, value, points, purchased_at
- reward_redemptions
  - client_id, cost, label, addons, additional_total, redeemed_at

## Camada de servicos

- authService
  - login/logout admin
  - leitura de sessao
  - validacao de permissao admin
- clientsService
  - listar clientes com historico
  - buscar cliente por telefone
  - cadastro de cliente
- purchasesService
  - registrar compra e creditar pontos
- rewardsService
  - registrar resgate e debitar pontos

## O que ainda configurar para producao forte

1. Mover operacoes criticas para RPC/Edge Functions para transacoes atomicas (compra/resgate).
2. Endurecer politicas RLS para area cliente com token curto por sessao de consulta.
3. Implementar rate limit e captcha para consulta de telefone.
4. Substituir SMS simulado por provedor real de OTP.
5. Configurar monitoramento de erros e auditoria de acoes administrativas.

## Scripts

- npm run dev
- npm run build
- npm run preview
