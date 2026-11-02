# [SPEC-ETAPA-02] Validação de autenticação e tratamento dos services

**Status:** implementada e validada em 01/11/2026; 14 critérios de aceite
aprovados com as limitações registradas na seção 9.  
**Data:** 1 de novembro de 2026.  
**Base:** `feat/scrum-230`, commit `8d994de`, com as alterações locais da
etapa 1.  
**Dependência:** etapa 1 concluída em organização e tipagem.  
**Requisitos principais:** O5 e E8.  
**Regressão:** O2, O3, O4, O11, O12, E7 e E9.

Referências:
[plano vigente, etapa 2](../docs/PLANO-CUMPRIMENTO-REQUISITOS.md#etapa-2--validação-de-autenticação-e-tratamento-dos-services)
e [critérios do projeto](../docs/REQUISITOS.md).

## 1. Problema e resultado esperado

Na base desta spec, `useAuthActions` encaminhava e-mail e senha ao Context sem
validação de aplicação, e `usePasswordReset` enviava o e-mail diretamente ao
service. Os formulários públicos dependiam principalmente da validação nativa do
navegador. `authService.ts` e `userProfileService.ts` também não usavam o
tratamento comum presente nos outros services.

Após esta etapa, entradas inválidas serão rejeitadas por funções tipadas em
`src/utils/`, antes de qualquer chamada externa. O usuário receberá erros
específicos por campo e foco no primeiro campo inválido. Os services terão
retornos tipados e tratamento de exceções que conserva os dados necessários aos
consumidores.

## 2. Escopo

### Entregas

- Tipos de entrada de login e recuperação de senha.
- Validadores puros, reutilizando `ValidationResult<T>` e as regras existentes.
- Integração nos hooks, nos formulários públicos e na recuperação iniciada pelo
  perfil.
- Tratamento comum das operações de autenticação e consulta de perfil.
- Conferência dos demais formulários e services para concluir O5/E8.
- Testes reproduzíveis e registro de evidências.

### Limites

As assinaturas existentes do Context e dos services, a persistência do Firebase,
os endpoints e os contratos da API serão preservados. Renovação automática de
token, novos interceptors, armazenamento versionado, reorganização geral dos
estados e auditoria completa de acessibilidade pertencem a outros trabalhos. A
integração desta etapa deve manter o loading, sucesso, erro e retry já
disponíveis.

## 3. Contratos de validação

Criar `src/types/auth.type.ts` com interfaces de domínio e acrescentar as
funções a `src/utils/validation.ts`:

```ts
export interface LoginValues {
	email: string;
	password: string;
}

export interface PasswordResetValues {
	email: string;
}

// Assinaturas em src/utils/validation.ts:
export function validateLogin(
	values: LoginValues,
): ValidationResult<LoginValues>;
export function validatePasswordReset(
	values: PasswordResetValues,
): ValidationResult<PasswordResetValues>;
```

`ValidationResult<T>` mantém a union discriminada existente: sucesso com `data`,
ou falha com `errors` por chave de `T`. As funções não fazem I/O, não alteram a
entrada e não usam `any`. Valores com tipos incorretos recebidos em runtime
devem produzir erro de campo, sem exceção de `.trim()` ou `.length`.

| Campo                       | Regra                                         | Normalização                  | Mensagem de erro                        |
| --------------------------- | --------------------------------------------- | ----------------------------- | --------------------------------------- |
| E-mail, obrigatório         | String; resultado após trim não vazio         | `trim().toLowerCase()`        | `Informe o e-mail.`                     |
| E-mail, tamanho             | Até 120 caracteres após normalização          | Aplicada antes da verificação | `O e-mail deve ter até 120 caracteres.` |
| E-mail, formato             | Mesmo critério de formato já usado no projeto | Reutilizar a regra existente  | `Informe um e-mail válido.`             |
| Senha de login, obrigatória | String com pelo menos um caractere            | Preservar integralmente       | `Informe a senha.`                      |
| Senha de login, tamanho     | Até 128 caracteres                            | Preservar integralmente       | `A senha deve ter até 128 caracteres.`  |

Para e-mail, a prioridade das mensagens é obrigatório, tamanho e formato. Tipo
incorreto usa a mensagem de campo obrigatório/inválido correspondente. Espaços
da senha são caracteres literais: não aplicar trim, lowercase ou outra
transformação. O login aceita senhas de 1 a 128 caracteres; a política de
criação de senha permanece de 8 a 128 caracteres. `rememberMe` continua sendo o
booleano fornecido pelo checkbox.

## 4. Requisitos funcionais

### RF-01 — Bloquear login inválido

`useAuthActions.handleSignIn` deve executar `validateLogin` antes de iniciar
loading ou chamar `signIn` do Context. Na falha, deve disponibilizar
`fieldErrors`, limpar feedback anterior de tentativa e retornar sem autenticar
ou navegar. No sucesso da validação, deve usar somente `validation.data.email` e
`validation.data.password`, com a preferência `rememberMe` original.

As assinaturas usadas pelos consumidores podem ser mantidas. O hook deve expor
erros de campo tipados como `Partial<Record<keyof LoginValues, string>>`, além
de loading e erro geral. Logout da sidebar e de `SignInAgain` continua
funcionando com a mesma API do hook.

### RF-02 — Bloquear recuperação inválida em todos os pontos de entrada

`usePasswordReset.submit` deve validar `{ email }` antes de chamar
`resetPassword`. E-mail inválido não provoca envio, não deixa loading ativo e
não exibe sucesso. O hook deve expor `fieldErrors` tipado para
`PasswordResetValues` e usar o e-mail normalizado quando válido.

O mesmo caminho vale para `/forget-password` e para o botão de recuperação em
`/perfil`. O perfil deve exibir a mensagem de validação junto à seção de
segurança; o botão mantém o foco e se relaciona à mensagem por
`aria-describedby`, pois ali não há campo de e-mail editável.

### RF-03 — Erros por campo e foco nos formulários

Login e recuperação devem renderizar cada erro em um elemento com ID estável e
`role="alert"`. O input correspondente deve receber `aria-invalid` e
`aria-describedby` enquanto houver erro. Na submissão inválida, o foco vai ao
e-mail e depois à senha, conforme o primeiro campo com erro na ordem visual.

Os formulários devem usar `noValidate` para que a validação nativa não impeça a
exibição das mensagens da aplicação. Manter labels, `type`, `required` e
autocomplete adequados. Limites HTML podem auxiliar a entrada; a função tipada
continua sendo a proteção antes do envio. `InputComponent` já propaga atributos
nativos e ARIA; alterá-lo somente se a integração exigir.

### RF-04 — Feedback de tentativa e nova tentativa

Uma tentativa válida limpa os erros anteriores de campo e apresenta loading.
Sucesso mantém o comportamento atual: navegação para `/home` no login e mensagem
de solicitação concluída na recuperação. Falha do provedor aparece como erro
geral no DOM e permite tentar novamente. Mensagens gerais e mensagens de campo
devem ter origens distintas, evitando duplicação do mesmo erro.

### RF-05 — Tratamento na camada de services

Aplicar `serviceRequest` ou tratamento equivalente às operações de
`authService.ts` e `getMyProfile`. Cada operação externa deve ter cobertura de
`try/catch` nessa camada, sem empilhar wrappers desnecessários. Conferir o mesmo
padrão em todos os arquivos de recurso de `src/services/`.

Preservar os retornos: login e signin retornam `Promise<SignInResponse>`; logout
e reset retornam `Promise<void>`; consulta de perfil retorna
`Promise<UserProfile>`. `POST /auth/signin`, `GET /users/me`, headers e
configuração da persistência permanecem com os contratos atuais.
`signInWithBackend` também atende à restauração de sessão no Context.

### RF-06 — Preservar a informação de falha

- Erros Axios e Firebase devem continuar disponíveis ao consumidor, com o objeto
  original, status, resposta e código.
- Cancelamento Axios deve continuar reconhecível como cancelamento.
  `AbortSignal` da consulta de perfil deve chegar à requisição.
- Falhas desconhecidas recebem mensagem de fallback específica da operação e
  conservam a causa, seguindo `serviceRequest`.
- Conta inativa ou sem autorização continua rejeitada; nenhum caminho converte
  falha em retorno de sucesso.
- A interface apresenta mensagem útil ao usuário e usa fallback quando não
  houver mensagem válida. Conteúdo de mensagem externa é renderizado como texto
  JSX.

### RF-07 — Conferência dos outros formulários

Verificar cadastro e edição de usuário, propriedade, permissão e status. Cada
submissão deve passar pelo validador tipado de `src/utils/` e enviar
`validation.data`. Preservar CPF/CNPJ, limites existentes, validação UUID,
`currentPropertyId` e o valor booleano `false`. Alterar apenas os caminhos que
falharem nessa conferência.

## 5. Arquivos afetados

| Arquivo ou área                                     | Responsabilidade nesta entrega                                |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `src/types/auth.type.ts`                            | Interfaces de entrada de autenticação.                        |
| `src/utils/validation.ts`                           | Validadores puros e regras compartilhadas.                    |
| `src/hooks/useAuthActions.ts`                       | Validação antes do Context; erros de campo e feedback.        |
| `src/hooks/usePasswordReset.ts`                     | Validação compartilhada entre recuperação pública e perfil.   |
| `src/pages/auth/Login/login.tsx`                    | Erros por campo, ARIA, foco e `noValidate`.                   |
| `src/pages/auth/ForgetPassword/forget-password.tsx` | Erros por campo, ARIA, foco e `noValidate`.                   |
| `src/pages/profile/profile.tsx`                     | Exibir falha de validação da recuperação pelo perfil.         |
| `src/services/authService.ts`                       | Tratamento de signin, persistência, logout e recuperação.     |
| `src/services/userProfileService.ts`                | Tratamento de exceção preservando o cancelamento.             |
| `src/services/serviceRequest.ts`                    | Reutilizar; alterar somente se os testes demonstrarem lacuna. |
| Demais hooks, formulários e services                | Conferência de regressão de O5/E8.                            |
| `tests/` e `package.json`                           | Testes versionados e comando `npm test`.                      |
| `README.md`, plano e requisitos                     | Comandos reais, evidências, status e limitações da entrega.   |

O Context e seus tipos são consumidores a conferir, não uma refatoração prevista
nesta spec. Interfaces de props permanecem locais e os novos tipos de domínio
ficam em `src/types/`, preservando O2/O4.

## 6. Critérios de aceite e testes

| ID    | Dado / quando                                                       | Resultado esperado                                                                                            |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| CA-01 | Login com e-mail vazio, inválido ou acima de 120 caracteres         | Erro correto por campo; zero chamadas ao Context/Firebase/API.                                                |
| CA-02 | Login com senha vazia ou acima de 128 caracteres                    | Erro de senha; zero chamadas externas.                                                                        |
| CA-03 | Entrada válida nos limites: e-mail de 120 caracteres e senha de 128 | Aceita; e-mail normalizado; senha preservada.                                                                 |
| CA-04 | Login com senha curta de conta existente, ou senha contendo espaços | Não aplicar política de criação ou transformação; encaminhar o conteúdo original.                             |
| CA-05 | Objetos de entrada com campo de tipo incorreto em runtime           | Resultado de validação com erro de campo; nenhuma exceção não tratada.                                        |
| CA-06 | Recuperação com e-mail inválido pelo formulário ou perfil           | Não chamar o service; erro no DOM; sem falso sucesso.                                                         |
| CA-07 | Recuperação válida com espaços externos e letras maiúsculas         | Chamar o service uma vez com e-mail normalizado; exibir sucesso após resolução.                               |
| CA-08 | Login com ambos os campos inválidos, seguido de correção            | Alertas associados aos inputs; foco no e-mail; nova tentativa válida limpa erros antigos.                     |
| CA-09 | Firebase/Axios rejeita login, reset, logout ou consulta de perfil   | Service rejeita preservando a falha; UI apresenta feedback e permite retry aplicável.                         |
| CA-10 | Backend rejeita conta inativa ou acesso sem autorização             | Não autenticar, não navegar para tela privada e não exibir sucesso.                                           |
| CA-11 | Consulta de perfil cancelada                                        | Signal encaminhado; erro continua identificável como cancelamento; consumidor mantém sua proteção de cleanup. |
| CA-12 | Falha desconhecida numa operação externa                            | Fallback da operação com causa preservada; sem sucesso silencioso.                                            |
| CA-13 | Alterar `rememberMe`, restaurar sessão e realizar logout            | Persistência e fluxo existentes preservados; logout não redireciona após falha.                               |
| CA-14 | Submeter os demais formulários com erros e com valores válidos      | Inválidos bloqueados; válidos enviam o payload validado, incluindo `active: false`.                           |

### Estratégia de verificação

1. Testar validadores puros e `serviceRequest` com o executor nativo do Node,
   conforme o plano, incluindo limites, normalização, preservação da senha e
   identidade dos erros.
2. Exercitar os handlers reais com serviços observáveis em testes com React real
   ou no navegador, comprovando a contagem zero de chamadas quando inválido. Um
   teste que chama somente o validador não comprova esse bloqueio.
3. Verificar DOM, associação de erros e foco no navegador ou em teste de
   componente com React real. Não implementar um simulador próprio de hooks para
   substituir essa verificação.
4. Adicionar `npm test` com os arquivos e o executor efetivamente adotados.
   Dependências de desenvolvimento adicionais precisam atender a um desses
   cenários que o ambiente atual não consegue executar.
5. Executar `npm test`, `npm run lint`, `npm run build` e `git diff --check`
   após a implementação. Usar dados sintéticos e transporte/provedores simulados
   nos testes automatizados.

A validação integrada com Firebase/backend reais e a navegação completa com
leitor de tela continuam na etapa 6. Registrar explicitamente quais verificações
desta spec usaram serviços simulados e quais ocorreram no navegador.

## 7. Ordem de implementação

- [x] Criar as interfaces e os testes dos validadores; implementar as regras
      puras.
- [x] Integrar os validadores nos dois hooks e verificar o bloqueio das chamadas
      externas.
- [x] Integrar mensagens, ARIA e foco nas páginas públicas e erro na seção de
      perfil.
- [x] Cobrir autenticação e perfil com o tratamento de services; testar
      preservação de erros e cancelamentos.
- [x] Conferir os demais formulários/services e os consumidores compartilhados,
      incluindo sidebar, `SignInAgain` e restauração de sessão.
- [x] Executar os critérios de aceite, lint, build e testes; corrigir falhas
      encontradas.
- [x] Registrar arquivos de teste, comandos, resultados, versão avaliada e
      limites no plano e em REQUISITOS.md.

## 8. Condição de conclusão

O5 e E8 só podem ser marcados como cumpridos após confirmar a cobertura dos
services, os validadores de todos os formulários e o bloqueio de entradas
inválidas nos handlers. Os critérios CA-01 a CA-14 devem ter resultado e
evidência reproduzível, admitindo os provedores simulados descritos nesta spec.
O11/O12/E7/E9 recebem apenas a evidência referente aos fluxos afetados, sem
declarar acessibilidade completa ou integração externa a partir desses testes.

A implementação e as evidências desta execução estão registradas abaixo. O
acompanhamento atualizado está no plano vigente e em REQUISITOS.md.

## 9. Registro da execução — 1 de novembro de 2026

Implementação na branch `feat/scrum-230`, sobre `8d994de`, incluindo as
alterações locais das etapas 1 e 2, ainda sem commit desta entrega. O5 e E8
cumpridos no escopo desta spec.

### Resultado dos comandos

- `npm test`: **45 testes aprovados**, sendo 10 com o executor nativo do Node e
  35 com Vitest.
- `npm run lint`: aprovado.
- `npm run build`: aprovado; o bundler emitiu avisos de diretivas `use client`
  em dependências, sem erro de compilação.
- `git diff --check`: aprovado.
- Inventário TypeScript: 43 componentes em pastas próprias com `index.tsx`;
  props com interfaces, sem `any` e sem código `.js`/`.jsx` em `src/`. O2/O4
  preservados.

### Correspondência dos critérios com as evidências

Todos os critérios abaixo foram aprovados no ambiente local descrito. As
referências apontam para testes versionáveis, não para verificações temporárias.

| Critério | Evidência principal                                                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-01    | `tests/validation.unit.test.ts` e login inválido/excesso de tamanho em `tests/auth.integration.test.tsx`.                                          |
| CA-02    | Limites de senha no teste unitário e bloqueio do handler real no teste de integração.                                                              |
| CA-03    | Caso de e-mail com 120 caracteres e senha com 128 no teste unitário.                                                                               |
| CA-04    | Senhas curtas/espaços no teste unitário; conteúdo original encaminhado pelo Context e pelo service nos testes de integração e service.             |
| CA-05    | Matriz de tipos incorretos em runtime no teste unitário.                                                                                           |
| CA-06    | Recuperação inválida na página pública e no perfil no teste de integração; nenhuma chamada ao service e foco verificado.                           |
| CA-07    | Recuperação válida nas duas páginas com normalização e sucesso verificados no teste de integração.                                                 |
| CA-08    | Erros relacionados aos inputs, ordem do foco e correção/retry no teste de integração.                                                              |
| CA-09    | Rejeições do SDK/HTTP em `tests/auth.service.test.ts`; falhas e retry de login, recuperação, logout e perfil em `tests/auth.integration.test.tsx`. |
| CA-10    | Conta inativa com mensagem externa renderizada como texto; Context continua sem autenticação e rota continua no login.                             |
| CA-11    | Signal e identidade do cancelamento em `tests/auth.service.test.ts`; proteção de cleanup do consumidor conferida no código.                        |
| CA-12    | Causa/fallback em `tests/serviceRequest.unit.test.ts` e casos de falha por operação em `tests/auth.service.test.ts`.                               |
| CA-13    | Persistência local/sessão e ordem das chamadas nos testes de service; restauração e logout com falha/retry nos testes com Context real.            |
| CA-14    | Validadores existentes no teste unitário e handlers reais em `tests/formMutations.integration.test.tsx`, incluindo `active: false`.                |

### Ambiente e limites

Execução com Node 22.23.2, Vitest 5.0.5, jsdom 30.1.3 e React/React DOM reais.
Somente Vitest e jsdom foram acrescentados como dependências diretas de
desenvolvimento; os validadores e o wrapper comum continuam com testes pelo
executor nativo do Node. O jsdom exige Node 22.22.2 ou superior na linha 22,
registrado no README. O CI passou a executar `npm test`.

Os testes de UI usam as páginas, os hooks, o Context e os componentes reais em
DOM do jsdom. SDK, serviços externos ou transporte são simulados conforme a
fronteira de cada arquivo de teste. O helper `tests/reactDom.ts` apenas
monta/desmonta React e dispara eventos DOM; não simula a implementação dos
hooks.

Firebase/backend reais, navegação visual em navegador e leitor de tela não foram
executados nesta entrega. Esses cenários permanecem na etapa 6. A conferência de
O5 também confirmou que os demais services de recurso passam por
`serviceRequest`; `serviceRequest.ts` permaneceu sem alterações.
