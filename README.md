# Arara's Açaí - Sistema de Fidelidade

Sistema web completo de fidelidade desenvolvido para uso real em uma açaíteria, conectando operação administrativa, experiência do cliente e automação de resgates em um único fluxo.

A aplicação foi pensada para digitalizar o acompanhamento de pontos, facilitar o relacionamento com clientes recorrentes e dar ao negócio uma base sólida para crescimento futuro. O projeto combina uma interface moderna em React com autenticação, banco de dados e regras de acesso no Supabase, além de integração com WhatsApp para tornar o resgate mais prático no dia a dia da loja.

## Sumário

- [Demonstração do sistema](#demonstração-do-sistema)
- [Funcionalidades principais](#funcionalidades-principais)
- [Diferenciais do projeto](#diferenciais-do-projeto)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Configuração do Supabase](#configuração-do-supabase)
- [Scripts disponíveis](#scripts-disponíveis)
- [Melhorias futuras](#melhorias-futuras)
- [Autor](#autor)

## Demonstração do sistema

O Arara's Açaí - Sistema de Fidelidade organiza toda a jornada do cliente dentro do programa de pontos:

1. O administrador cadastra clientes ou realiza um pré-cadastro manual.
2. Cada compra registrada gera pontuação automaticamente.
3. O cliente acessa sua área autenticada para consultar saldo, histórico e recompensas disponíveis.
4. Quando houver pontos suficientes, o resgate pode ser feito pela plataforma.
5. O pedido segue para o WhatsApp com uma mensagem já estruturada para agilizar o atendimento.

Link do projeto: [Adicionar URL de produção aqui](#)

## Funcionalidades principais

### Área do cliente

- Cadastro e login com e-mail e senha.
- Recuperação de senha com fluxo seguro via Supabase Auth.
- Vínculo entre conta autenticada e cadastro existente por telefone ou e-mail.
- Consulta de saldo de pontos em tempo real.
- Histórico de compras registradas no programa.
- Histórico de resgates realizados.
- Resgate de recompensas com seleção de opções e adicionais.
- Redirecionamento para o WhatsApp com mensagem automática para concluir o pedido.

### Área administrativa

- Login administrativo com controle de acesso por perfil.
- Painel para visualização e gestão da base de clientes.
- Cadastro manual de clientes pelo administrador, inclusive em formato de pré-cadastro.
- Registro de novas compras com crédito automático de pontos.
- Gestão de resgates diretamente pelo painel interno.
- Exclusão de clientes e atualização da base com feedback visual.
- Gestão de tamanhos e opções de recompensa.

### Regras de fidelidade

- Sistema de pontos baseado em consumo.
- Na implementação atual, a regra aplicada é simples e objetiva: cada R$ 1 em compra gera 1 ponto.
- A lógica foi estruturada para permitir adaptações futuras, incluindo regras equivalentes por volume ou produto, como cenários do tipo 300 ml = 300 pontos.
- Resgates podem representar recompensas como açaí grátis, com controle de custo em pontos e histórico da operação.

### Segurança e autenticação

- Autenticação segura com Supabase Auth.
- Rotas protegidas para cliente e administrador.
- Políticas de acesso no banco com RLS.
- Separação de perfis administrativos e clientes.
- Persistência de sessão e recuperação de senha integradas ao fluxo da aplicação.

## Diferenciais do projeto

- Projeto aplicado a um negócio físico real, com foco em operação do dia a dia e retenção de clientes.
- Integração completa entre front-end e back-end, sem depender de soluções terceiras improvisadas.
- Estrutura pensada para evolução futura como produto escalável e potencial SaaS.
- Interface moderna, responsiva e com suporte a tema claro e escuro.
- Experiência do usuário otimizada para reduzir atrito no login, consulta de pontos e resgate.
- Integração com WhatsApp como ponte direta entre fidelidade e conversão de pedido.

## Tecnologias utilizadas

### Front-end

- React
- JavaScript
- CSS
- Vite
- React Router

### Back-end e serviços

- Supabase Auth
- Supabase Database
- Supabase Storage

### Qualidade e organização

- ESLint
- Estrutura modular por componentes, páginas, hooks e serviços
- Interface com suporte a tema claro/escuro

## Estrutura do projeto

```text
src/
  components/
  pages/
  hooks/
  services/
  constants/
  data/
  lib/
  utils/
  assets/
supabase/
public/
```

### Pastas principais

- src/: núcleo da aplicação front-end.
- components/: componentes reutilizáveis da interface, incluindo módulos de cliente, autenticação, administração e UI.
- pages/: telas principais da aplicação, como login, portal do cliente, painel admin e redefinição de senha.
- hooks/: hooks customizados para autenticação, tema e estados compartilhados.
- services/: camada responsável pela comunicação com Supabase e pelas regras de negócio.

## Como rodar localmente

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd projeto-araras
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo chamado `.env.local` na raiz do projeto e adicione as credenciais do seu projeto Supabase.

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-do-supabase
```

### 4. Rodar o projeto

```bash
npm run dev
```

### 5. Acessar no navegador

Por padrão, o Vite disponibiliza a aplicação em:

```text
http://localhost:5173
```

## Variáveis de ambiente

Exemplo de configuração:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-do-supabase
```

Descrição das variáveis:

- VITE_SUPABASE_URL: URL da instância do projeto no Supabase.
- VITE_SUPABASE_ANON_KEY: chave pública utilizada pela aplicação cliente para autenticação e acesso controlado.

## Configuração do Supabase

O repositório já possui uma pasta supabase/ com scripts SQL para criação da estrutura, ajustes de schema e regras de acesso.

Ordem recomendada para um ambiente novo:

1. schema.sql
2. add-phone-digits-migration.sql
3. reward-options.sql
4. toppings-setup.sql
5. reward-sizes-migration.sql
6. client-area-rls.sql
7. claim-client-by-phone-rpc.sql
8. admin-delete-clients-policy.sql

Arquivos auxiliares de manutenção:

- repair-cloud-schema.sql
- verify-micaella-link.sql

Também é necessário garantir que o usuário administrador tenha um registro compatível com perfil de admin no banco para acesso ao painel interno.

## Scripts disponíveis

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

- npm run dev: inicia o ambiente de desenvolvimento.
- npm run build: gera a build de produção.
- npm run preview: executa uma visualização local da build.
- npm run lint: valida o código com ESLint.

## Melhorias futuras

- Dashboard com métricas mais avançadas de retenção, recompra e ticket médio.
- Plano premium para empresas que desejarem usar o sistema como serviço.
- Notificações automáticas para campanhas, saldo de pontos e recompensas disponíveis.
- Estrutura multi-loja para operação em mais de uma unidade.
- Aplicativo mobile para clientes e operação interna.

## Autor

**Giovanne Medeiros**

LinkedIn: [Adicionar link do LinkedIn aqui](#)

---

Este projeto representa uma aplicação real com foco em produto, operação e experiência do usuário. É um case consistente para portfólio profissional por unir interface, autenticação, regras de negócio, integração com banco de dados e uso prático em um cenário comercial.
