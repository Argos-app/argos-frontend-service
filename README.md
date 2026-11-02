<p align="center">
  <img src="./src/assets/logo_main.svg" alt="Argos" width="320" />
</p>

# Argos (Painel administrativo)

Aplicação web da plataforma Argos para gerenciar usuários, permissões e propriedades rurais, consultar o perfil autenticado e baixar relatórios históricos de rebanho.

[Aplicação](https://argos-frontend-service.vercel.app/) · [Começando](#começando) · [Comandos](#comandos) · [Estrutura](#estrutura-do-projeto) · [Deploy](#deploy)

## Funcionalidades

- **Autenticação:** login por e-mail e senha com Firebase, opção de manter a sessão e recuperação de senha por e-mail.
- **Usuários:** cadastro, edição, remoção, consulta de fazendas vinculadas e ativação ou desativação de contas.
- **Acessos:** consulta e alteração das permissões dos usuários.
- **Propriedades:** cadastro, edição e desativação de fazendas com administrador responsável.
- **Perfil:** dados pessoais, permissão, status da conta, fazendas vinculadas e solicitação de redefinição de senha.
- **Relatórios de rebanho:** consulta paginada, filtro por fazenda e download de arquivos XLSX para usuários com permissão `ADMIN`.

As telas de gestão oferecem paginação e pesquisa nos registros da página atual. A navegação inclui menu recolhível, busca no menu e rotas protegidas por autenticação.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | React 19, TypeScript, Ant Design 5 e Lucide React |
| Estilos | Tailwind CSS 4 |
| Navegação | React Router 8, `React.lazy` e `Suspense` |
| Autenticação e API | Firebase Authentication e Axios |
| Build e qualidade | Vite 8, ESLint 10 e GitHub Actions |
| Hospedagem | Vercel |

## Começando

### Pré-requisitos

- **Node.js 22.13 ou superior na linha 22**, usada no CI, e npm.
- Um projeto Firebase com aplicação Web registrada e autenticação por e-mail e senha habilitada.
- A API Argos acessível e configurada para aceitar requisições da origem do frontend.
- Uma conta reconhecida pelo Firebase e autorizada pela API Argos.

### Instalação e configuração

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/Argos-app/argos-frontend-service.git
   cd argos-frontend-service
   npm ci
   ```

2. Copie [`.env.example`](./.env.example) para `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   No PowerShell, use `Copy-Item .env.example .env.local`.

3. Preencha as variáveis em `.env.local`:

   | Variável | Valor esperado |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | Chave da aplicação Web no Firebase. |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação, como `seu-projeto.firebaseapp.com`. |
   | `VITE_FIREBASE_PROJECT_ID` | Identificador do projeto Firebase. |
   | `VITE_API_URL` | URL base da API, incluindo o prefixo da versão. O exemplo usa `http://localhost:8080/api/v1`. |

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:4200](http://localhost:4200) e entre com uma conta autorizada. Se a porta estiver ocupada, confira a URL exibida pelo Vite no terminal.

> [!IMPORTANT]
> O login depende do Firebase e da API: após autenticar no Firebase, o frontend envia o ID token a `POST /auth/signin` e usa o `bearerToken` retornado nas chamadas seguintes. Configure os dois serviços antes de testar as telas protegidas.

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm ci` | Instala as versões registradas em `package-lock.json`. |
| `npm run dev` | Inicia o Vite na porta 4200, quando disponível. |
| `npm run lint` | Executa a análise estática com ESLint. |
| `npm run build` | Verifica os tipos com `tsc -b` e gera os arquivos de produção em `dist/`. |
| `npm run preview` | Serve o build de `dist/` para conferência local. Execute o build antes. |

O teste de mensagens de erro de login usa o executor nativo do Node.js:

```bash
node --experimental-strip-types --test tests/authError.test.ts
```

Esse teste cobre erros do Firebase, mensagens retornadas pelo backend e falhas desconhecidas. Não há script `npm test` configurado.

## Rotas

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/login` | Login | Visitantes |
| `/forget-password` | Recuperação de senha | Visitantes |
| `/home` | Início | Autenticado |
| `/perfil` | Perfil e redefinição de senha | Autenticado |
| `/gestao-usuarios` | Gestão de usuários | Autenticado |
| `/gestao-acessos` | Gestão de permissões e status das contas | Autenticado |
| `/gestao-propriedades` | Gestão de propriedades | Autenticado |
| `/relatorios-rebanho` | Histórico e exportação de relatórios | Autenticado, com permissão `ADMIN` |

A raiz `/` redireciona para `/login`. Usuários autenticados que acessam as telas de visitantes são encaminhados para `/home`. As listas de usuários e acessos também aceitam `/pagina/:page` ao final da rota.

As permissões de cada operação são validadas pela API. A tela de relatórios verifica `permissionCode` no perfil retornado por `GET /users/me`; listagem e exportação usam `GET /reports/herds` e `GET /reports/herds/{reportId}/export`, relativos a `VITE_API_URL`. O XLSX é produzido pelo backend e baixado pelo frontend.

## Estrutura do projeto

```text
├── .github/workflows/  validação e deploy automatizados
├── public/             arquivos estáticos
├── src/
│   ├── assets/         identidade visual
│   ├── components/     formulários, drawers, tabelas e navegação
│   ├── context/        contexto e restauração da autenticação
│   ├── hooks/          estado, paginação, consultas e mutações
│   ├── lib/            clientes Firebase e HTTP, formatação e utilitários
│   ├── pages/          telas da aplicação
│   ├── services/       chamadas à API e ao Firebase
│   ├── types/          tipos de domínio e contratos da API
│   ├── utils/          validação e tratamento de erros
│   ├── App.tsx         definição de rotas e carregamento sob demanda
│   └── main.tsx        inicialização e providers
├── tests/              testes de mensagens de erro de autenticação
├── .env.example        modelo de configuração local
└── vercel.json         diretório de saída e rewrite das rotas
```

O alias `@/` aponta para `src/`. Os componentes usam hooks para coordenar estado e operações; os services concentram a comunicação externa. `AuthProvider` restaura a sessão a partir do Firebase e mantém o token da API em memória.
