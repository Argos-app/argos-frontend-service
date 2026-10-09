# Argos · Painel administrativo

Aplicação web para autenticação e gestão de usuários e propriedades da plataforma Argos. Construída com React, TypeScript e Vite.

## Requisitos locais

- Node.js 22 ou superior
- npm
- Backend Argos disponível em uma URL acessível pela aplicação
- Projeto Firebase com Authentication por e-mail e senha habilitado

## Configuração

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env.local`.
3. Preencha as variáveis `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_API_URL`.
4. Inicie o frontend com `npm run dev`.

O Vite disponibiliza o painel em `http://localhost:4200`. Para ambiente local, `VITE_API_URL` normalmente aponta para `http://localhost:8080/api/v1`.

## Comandos

- `npm run dev`: servidor local de desenvolvimento.
- `npm run lint`: análise estática do código.
- `npm run build`: verificação TypeScript e build de produção.
- `npm run preview`: servir localmente o build gerado.

## Deploy na Vercel

O workflow `.github/workflows/deploy.yml` publica a branch `main` na Vercel. Configure no repositório GitHub:

- Secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`.
- Variáveis de ambiente `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_API_URL` no projeto Vercel para o ambiente Production.
- O domínio de produção nas configurações de Firebase Authentication, quando necessário.

O arquivo `vercel.json` encaminha rotas do React Router para a aplicação SPA. Após o primeiro deploy, registre aqui a URL pública: **pendente de configuração do projeto e dos secrets da Vercel**.

## Critérios e status

O inventário de requisitos, evidências, percentuais e itens que dependem de validação presencial está em [REQUISITOS.md](./REQUISITOS.md).
