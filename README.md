# Arara's Açaí | Sistema de Fidelidade

Aplicação web para gestão de programa de fidelidade da Arara's Açaí, com:

- Área administrativa para cadastro e operação de clientes
- Área do cliente com consulta de pontos e resgate de recompensas
- Integração com Supabase (Auth, banco PostgreSQL e políticas RLS)
- Fluxo de finalização via WhatsApp

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack e arquitetura](#stack-e-arquitetura)
- [Rotas da aplicação](#rotas-da-aplicação)
- [Pré-requisitos](#pré-requisitos)
- [Configuração local](#configuração-local)
- [Configuração do Supabase](#configuração-do-supabase)
- [Scripts disponíveis](#scripts-disponíveis)
- [Deploy](#deploy)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)
- [Roadmap recomendado](#roadmap-recomendado)

## Visão geral

O projeto foi desenhado para centralizar o ciclo de fidelidade:

1. Admin cadastra cliente e registra compras.
2. Sistema converte compras em pontos.
3. Cliente acompanha saldo e histórico na área autenticada.
4. Cliente (ou admin) registra resgate de recompensa.
5. Pedido é direcionado para o WhatsApp com resumo do resgate.

## Funcionalidades

### Área administrativa

- Login administrativo com validação de perfil `role = 'admin'`
- Dashboard com métricas principais
- Cadastro e exclusão de clientes
- Registro de compras e crédito de pontos
- Resgate assistido de recompensas
- Gestão de tamanhos de açaí:
  - criar, editar, excluir
  - ativar/desativar
  - reordenar prioridade

### Área do cliente

- Login com e-mail e senha
- Cadastro de nova conta (com vínculo por telefone/e-mail)
- Recuperação de senha via e-mail (`/update-password`)
- Visualização de saldo de pontos
- Histórico de compras
- Histórico de resgates
- Resgate com opções de tamanho e adicionais
- Abertura de conversa no WhatsApp com mensagem pré-montada

## Stack e arquitetura

### Tecnologias

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- Supabase JS 2
- ESLint 9

### Estrutura de pastas

```text
src/
  assets/
  components/
    admin/
    auth/
    client/
    ui/
  constants/
  data/
  hooks/
  lib/
  pages/
  services/
  utils/
supabase/
```

### Organização por camadas

- `pages`: composição das telas e fluxos principais
- `components`: UI reutilizável por domínio
- `services`: acesso a dados e regras de integração Supabase
- `hooks`: gerenciamento de sessão e estados transversais
- `utils`: formatação, tratamento de erro e utilitários de domínio

## Rotas da aplicação

- `/` -> redireciona para `/login`
- `/login` -> login/cadastro de cliente
- `/cliente` -> portal do cliente (protegido)
- `/update-password` -> redefinição de senha do cliente
- `/admin` -> login administrativo
- `/admin/dashboard` -> portal administrativo (protegido)
- `/admin/tamanhos` -> gestão de tamanhos de recompensa (protegido)

## Pré-requisitos

- Node.js 20+
- npm 10+
- Projeto Supabase ativo

## Configuração local

1. Instale as dependências:

```bash
npm install
```

2. Configure variáveis de ambiente criando `.env.local`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_SUPABASE_ANON_KEY
```

3. Inicie o projeto em desenvolvimento:

```bash
npm run dev
```

4. Acesse a aplicação no endereço exibido pelo Vite (padrão: `http://localhost:5173`).

## Configuração do Supabase

### 1) Executar scripts SQL

Na pasta `supabase/` existem scripts de estrutura e ajustes. Ordem sugerida de aplicação em ambiente novo:

1. `schema.sql`
2. `add-phone-digits-migration.sql`
3. `reward-options.sql`
4. `toppings-setup.sql`
5. `reward-sizes-migration.sql`
6. `client-area-rls.sql`
7. `claim-client-by-phone-rpc.sql`
8. `admin-delete-clients-policy.sql`

Scripts de manutenção/correção pontual (executar apenas quando necessário):

- `repair-cloud-schema.sql`
- `verify-micaella-link.sql`

### 2) Criar usuários admin

No painel do Supabase:

1. Vá em Authentication -> Users
2. Crie o usuário administrador
3. Garanta registro correspondente em `profiles` com `role = 'admin'`

### 3) Tabelas principais utilizadas

- `profiles`
- `clients`
- `purchases`
- `reward_redemptions`
- `reward_options`
- `reward_sizes`
- `toppings`

## Scripts disponíveis

- `npm run dev` -> inicia ambiente local
- `npm run build` -> gera build de produção
- `npm run preview` -> pré-visualiza build local
- `npm run lint` -> executa verificação de lint

## Deploy

### Vercel

O projeto já possui `vercel.json` com rewrite SPA:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Checklist para produção:

1. Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente da Vercel
2. Garantir execução das migrações no Supabase de produção
3. Revisar políticas RLS antes de abrir acesso público

## Segurança

Medidas já implementadas:

- Sessão via Supabase Auth
- Rotas protegidas para admin e cliente
- Validação de permissão administrativa em `profiles`
- RLS habilitado nas tabelas de domínio
- Logout limpando sessão local/global

Reforços recomendados para evolução:

1. Transações críticas em RPC/Edge Functions com controle atômico
2. Rate limit para endpoints sensíveis de autenticação/consulta
3. Monitoramento de erros e trilha de auditoria para ações administrativas

## Troubleshooting

### Erro de Supabase não configurado

- Verifique `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `.env.local`
- Reinicie o servidor de desenvolvimento

### Erro relacionado a `phone_digits`

- Execute `add-phone-digits-migration.sql`
- Revalide constraints de telefone único

### Falha ao vincular cliente por telefone

- Confira se a RPC `claim_client_by_phone` foi criada
- Aplique `claim-client-by-phone-rpc.sql`
- Revise permissões RLS para a operação

### Login admin sem permissão

- Confirme se o usuário existe em `profiles` com `role = 'admin'`
- Verifique se o `id` do profile corresponde ao `auth.users.id`

## Roadmap recomendado

1. Testes automatizados (unitários + integração)
2. Logs estruturados e observabilidade
3. Fluxo de auditoria para ações sensíveis
4. Versionamento formal de migrações por ambiente

---

Se quiser, posso também gerar uma versão curta do README para vitrine de portfólio (mais focada em resultado de negócio e screenshots) mantendo esta como documentação técnica principal.
