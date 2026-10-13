# Argos — Painel administrativo

Aplicação web para administrar usuários, acessos e propriedades da plataforma Argos. O painel também permite consultar o perfil do usuário autenticado e iniciar a recuperação de senha.

## Funcionalidades

- Autenticação por e-mail e senha e recuperação de acesso.
- Consulta de usuários, propriedades, fazendas vinculadas e permissões.
- Criação, edição e desativação de usuários e propriedades.
- Consulta do perfil, dos dados de acesso e das fazendas do usuário autenticado.
- Rotas protegidas e navegação por teclado com controles acessíveis.

## Tecnologias

React 19, TypeScript, Vite, React Router, Ant Design, Tailwind CSS, Firebase Authentication e Axios.

## Acessos

- **Produção:** [argos-frontend-service.vercel.app](https://argos-frontend-service.vercel.app/)
- **Homologação (Preview):** [argos-frontend-service-64wzvnnxa-luismede.vercel.app](https://argos-frontend-service-64wzvnnxa-luismede.vercel.app/)
- **Detalhes do deployment:** [abrir no painel da Vercel](https://vercel.com/luismede/argos-frontend-service/7wUjNKN3TmD666zNrAciYa4Rn59t)

## Começando

### Pré-requisitos

- Node.js 22 ou superior e npm.
- Um projeto Firebase com autenticação por e-mail e senha habilitada.
- Uma instância acessível da API Argos.

### Configuração local

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Copie `.env.example` para `.env.local`.
3. Preencha as variáveis do Firebase e da API:

   | Variável | Descrição |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | Chave da aplicação Web no Firebase. |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação do projeto Firebase. |
   | `VITE_FIREBASE_PROJECT_ID` | Identificador do projeto Firebase. |
   | `VITE_API_URL` | URL base da API, incluindo o prefixo da versão. |

   Para desenvolvimento local, a URL da API costuma ser `http://localhost:8080/api/v1`.

4. Inicie o servidor:

   ```bash
   npm run dev
   ```

   O painel estará disponível em `http://localhost:4200`.

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento na porta 4200. |
| `npm run lint` | Verifica padrões e possíveis problemas no código. |
| `npm run build` | Verifica os tipos TypeScript e gera a versão de produção em `dist/`. |
| `npm run preview` | Serve localmente a versão gerada em `dist/`. |

## Estrutura do projeto

```text
src/
├── components/  componentes de interface reutilizáveis
├── context/     estado compartilhado de autenticação
├── hooks/       estado e operações usados pelas telas
├── lib/         clientes Firebase, HTTP e armazenamento de sessão
├── pages/       páginas e rotas da aplicação
├── services/    comunicação com a API e Firebase
├── types/       tipos de domínio e contratos da API
└── utils/       validação e funções auxiliares
```

As páginas são carregadas sob demanda. O acesso às rotas privadas é controlado pelo contexto de autenticação; chamadas à API ficam nos services, e os formulários validam os dados antes de enviá-los.

## Convenções de contribuição

- Use TypeScript (`.ts` e `.tsx`) em `src/` e evite `any`.
- Mantenha componentes, páginas e tipos de domínio organizados nas pastas existentes.
- Preserve nomes acessíveis, labels associados aos campos, mensagens de erro e navegação por teclado.
- Use mensagens de commit no padrão Conventional Commits, por exemplo `feat(profile): exibir dados do usuário` ou `fix(auth): tratar sessão expirada`.
- Antes de abrir um pull request, execute `npm run lint` e `npm run build`.
