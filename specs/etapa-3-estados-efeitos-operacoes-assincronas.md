# [SPEC-ETAPA-03] Estados relacionados, efeitos e operações assíncronas

**Status:** implementada e validada em 02/11/2026; 20 critérios de aceite com
evidências registradas.  
**Data:** 1 de novembro de 2026.  
**Base:** `feat/scrum-230`, commit `8d994de`, com as alterações locais das
etapas 1 e 2.  
**Dependência:** etapa 2 concluída no escopo da
[SPEC-ETAPA-02](./etapa-2-validacao-autenticacao-services.md).  
**Requisitos principais:** O6 e O7.  
**Regressão:** O2, O4, O5, O9, O12, E1, E2, E3, E6, E8 e E9.

Referências: [plano vigente](../docs/PLANO-CUMPRIMENTO-REQUISITOS.md) e
[critérios do projeto](../docs/REQUISITOS.md).

## 1. Problema e resultado esperado

Na base desta spec, `AuthContext`, `useAuthActions`, `usePasswordReset` e
`useAiUsage` mantêm campos relacionados em chamadas separadas de `useState`.
Outros fluxos já agrupam estado e possuem cancelamento, mas ainda precisam de
evidências comportamentais de troca de página, respostas antigas, cleanup e
polling. Essa observação não significa que todo efeito existente esteja
incorreto.

A etapa deve agrupar os estados que representam a mesma operação, preservar
estados independentes e verificar os efeitos com React real. Uma operação deve
transitar de forma coerente entre carregamento, sucesso, falha e nova tentativa.
Respostas de uma consulta substituída não podem sobrescrever os dados atuais;
desmontagem deve liberar timers, listeners e consultas pertencentes ao
componente.

## 2. Escopo e decisões de implementação

- Reutilizar `useState`, o reducer de paginação, os hooks e os formulários Ant
  Design existentes.
- Usar objetos de estado locais e fases tipadas. Unions discriminadas devem
  representar fases exclusivas quando isso impedir combinações inválidas; não há
  necessidade de um reducer novo para cada hook.
- Derivar `loading`, `sent`, abertura e outros indicadores a partir da fase
  quando representarem a mesma informação. Manter o formato público esperado
  pelos consumidores.
- Preservar os contratos dos services, os validadores e os erros por campo
  entregues na etapa 2, assim como as mudanças de paginação de IA da branch
  atual.
- Reutilizar Node, Vitest, jsdom e React/React DOM já disponíveis. A etapa não
  prevê dependência nova, biblioteca global de estado, cache global ou abstração
  genérica de execução assíncrona.
- A persistência versionada continua na etapa 4; as correções gerais de
  acessibilidade e sua validação integrada continuam nas etapas 5 e 6.
  Demonstrações de apresentação permanecem fora dos critérios de conclusão.

## 3. Inventário e decisões sobre o estado

Antes de alterar código, inventariar todas as chamadas de `useState`,
`useReducer`, `Form.useForm` e `useEffect` em `src/`. Para cada conjunto,
registrar o arquivo, os campos, quem inicia/encerra a operação e a decisão:
agrupar, preservar ou derivar. A quantidade de hooks, isoladamente, não
determina se há problema.

| Área                                             | Situação na base                                                                 | Direção da entrega                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `AuthContext`                                    | Perfil, inicialização e erro de restauração separados                            | Agrupar a restauração/sessão e derivar a inicialização. Preservar Provider, hook e API de consumo.                            |
| `useAuthActions`                                 | Loading, erro geral e erros de campo separados                                   | Agrupar a operação de login/logout, preservando a distinção entre erro inicial e feedback de uma tentativa.                   |
| `usePasswordReset`                               | Loading, sucesso, erro geral e erros de campo separados                          | Agrupar em fases e derivar `loading`/`sent`, mantendo as duas páginas consumidoras.                                           |
| `useAiUsage`                                     | Página, resposta, loading, erro, data de atualização e tentativa separados       | Agrupar os campos da consulta; manter dados e data da última resposta válida associados à página correta.                     |
| `useHerdReports`                                 | Consultas de opções e download com estados próprios                              | Revisar correlação, agrupar ID/erro/fase do download quando aplicável e preservar o reducer compartilhado da listagem.        |
| `usePaginatedResource`                           | Reducer com State/Action discriminados                                           | Preservar a estrutura e testar página, tamanho, reload e rejeição de respostas antigas. Corrigir somente lacunas comprovadas. |
| `useUserProfile`                                 | Dados/loading/erro já agrupados                                                  | Preservar o agrupamento; verificar retry, substituição de consulta e cleanup.                                                 |
| Opções de usuários, permissões e administradores | Estado já agrupado e consultas com AbortController                               | Verificar fechar/reabrir, retry e resposta tardia, preservando a reutilização de opções concluídas enquanto válida.           |
| `DeleteButton` e drawers de gestão               | Confirmação com fases e criação/edição mutuamente exclusivas                     | Preservar o que já atende; conferir fechamento durante envio e limpeza dos formulários ao trocar registro.                    |
| Campos locais e preferências                     | Credenciais agrupadas, `rememberMe`, filtros, buscas, expansão, seleção e avatar | Preservar estados independentes e valores derivados, registrando a justificativa quando houver mais de um `useState`.         |

O inventário final deve justificar todas as decisões. Alterar apenas o que
faltar para O6/O7 ou falhar nos cenários desta spec. Props e objetos recebidos
não podem ser alterados diretamente; arrays locais recém-criados podem ser
construídos antes de entrar no estado.

## 4. Requisitos funcionais

### RF-01 — Restauração e sessão coerentes no Context

A inicialização deve representar restauração pendente, ausência de sessão,
sessão autenticada ou falha de restauração com sessão anônima. Perfil e erro
correspondentes devem ser atualizados de forma coerente. O indicador de
inicialização deve ser derivado do estado que o contém.

O estado de restauração aplica-se à inicialização do Provider. Um login enviado
pelo formulário não deve remontar a árvore inteira como se estivesse na
inicialização, apagando os campos do usuário. Preservar `user`, `profile`,
`isAuthenticated`, `initializationError`, `signIn` e `logout` no Context.

Uma restauração que termine após o cleanup não deve alterar o estado nem os
headers da API. Signin explícito e logout devem manter a sincronização existente
entre perfil e Authorization. Falha de logout conserva a sessão atual; logout
bem-sucedido limpa perfil e header. A preferência de persistência continua sob
responsabilidade do service Firebase.

### RF-02 — Estados de login e recuperação agrupados

Cada hook deve reunir fase, erro geral e erros de campo da operação num único
objeto de estado. `usePasswordReset` também deve derivar o sucesso dessa fase.
Os nomes públicos `loading`, `error`, `fieldErrors`, `sent`, `handleSignIn`,
`handleLogout` e `submit` permanecem disponíveis onde já existem.

As transições precisam obedecer aos seguintes resultados observáveis:

| Evento                                              | Resultado esperado                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Entrada inválida                                    | Sem chamada externa, sem loading/sucesso; somente erros da tentativa atual.    |
| Envio válido                                        | Limpar erros anteriores; apresentar loading até a resolução.                   |
| Sucesso                                             | Encerrar loading e aplicar o feedback/navegação já existentes.                 |
| Falha                                               | Encerrar loading; apresentar erro geral e permitir nova tentativa.             |
| Correção e retry                                    | Substituir o feedback anterior sem misturar sucesso de outra tentativa.        |
| Falha inicial do Context seguida de tentativa local | O formulário passa a exibir o feedback da tentativa local, conforme a etapa 2. |

Um exemplo de formato adequado para recuperação é uma union local com fases
`idle`, `submitting`, `success`, `invalid` e `error`; as fases de falha carregam
somente os erros necessários. A implementação deve escolher o menor tipo que
represente essas transições, sem criar um mecanismo compartilhado de estados
para todos os hooks.

### RF-03 — Consultas substituídas e cancelamento

Consultas de listas, perfil e opções devem encaminhar `AbortSignal` ao service.
Trocar página, tamanho, filtro, tentativa ou desmontar o dono da consulta deve
cancelar a consulta anterior quando ela for substituída.

O código deve ignorar sucesso e falha de uma consulta cancelada mesmo quando o
transporte simulado não interromper a promise. Respostas precisam continuar
associadas aos parâmetros e à tentativa que as originaram. A verificação não
pode depender apenas de ter chamado `abort()`.

Controles imperativos, como AbortController e IDs de timer, podem ficar em refs
ou variáveis do efeito. Eles não devem criar uma segunda fonte de verdade para
dados ou indicadores exibidos.

### RF-04 — Paginação, reducer e URL

Preservar State/Action tipados em unions discriminadas em
`usePaginatedResource`. Página, tamanho, metadados e tentativa devem continuar
identificando a resposta aceita. Selecionar a página ou o tamanho atuais não
deve criar loading sem uma nova consulta; reload deve provocar uma nova
tentativa.

Em usuários e acessos, parâmetros ausentes ou inválidos devem conservar o
tratamento atual e a URL deve acompanhar a navegação. Ao remover o último
usuário de uma página posterior à primeira, carregar a anterior e atualizar a
URL de forma coerente. A sincronização da rota não pode recolocar o usuário na
página vazia. Desativação da última propriedade deve preservar a correção
equivalente de página, sem criar uma rota nova.

Na listagem de relatórios, mudar a fazenda deve manter o reinício na primeira
página e a associação entre filtro, resposta e linha baixada. Preservar o `key`
que já controla esse reinício ou comprovar comportamento equivalente.

### RF-05 — Polling de uso de IA

Preservar a consulta paginada e o tamanho 10 da implementação atual. O próximo
ciclo deve ocorrer 30 segundos após a conclusão do ciclo anterior, sem
sobreposição de polling no mesmo ciclo ativo.

- Primeira carga: apresentar loading e não atribuir data de atualização antes de
  uma resposta válida.
- Resposta válida: atualizar dados, metadados e data juntos para a página
  consultada.
- Falha posterior na mesma página: manter a última resposta válida e sua data,
  indicando que os dados estão desatualizados.
- Troca de página: não exibir linhas ou data da página anterior como se
  pertencessem à nova; resposta tardia anterior deve ser ignorada.
- Retry manual: substituir o ciclo anterior, mantendo apenas o timer e a
  consulta pertencentes ao ciclo atual.
- Desmontagem: abortar a consulta, liberar o timer e impedir que um `finally`
  antigo agende outro ciclo.

Preservar os campos públicos e callbacks usados por `AiUsagePanel`. Selecionar a
página atual deve ser uma operação sem efeito. Falha de dados inválidos deve
continuar apresentando a mensagem de `InvalidAiUsageResponseError`.

### RF-06 — Opções, drawers e formulários

Fechar um drawer com consulta de opções pendente deve invalidar aquela consulta.
Reabrir pode iniciar uma nova consulta; resultados do ciclo anterior não podem
substituir o estado do ciclo atual. Opções de uma consulta concluída podem
continuar sendo reutilizadas conforme a política atual de cada hook.

Os efeitos de preenchimento dos formulários devem declarar todas as dependências
utilizadas e limpar valores/erros do registro anterior quando o registro de
edição mudar. Preservar `Form.useForm` como fonte de verdade dos campos,
evitando duplicar os mesmos valores em estado React.

Criação e edição continuam mutuamente exclusivas. Envio pendente mantém o
bloqueio de fechamento/reenvio do mesmo controle; falha permite corrigir e
tentar novamente, preservando os dados digitados. A confirmação de
exclusão/desativação permanece aberta após falha com seu feedback.

### RF-07 — Download e feedback de mutações

Revisar o estado do download de relatório, agrupando os campos da mesma operação
e derivando o ID em download da fase correspondente, quando aplicável. Preservar
o bloqueio de download simultâneo, mensagens, nome de arquivo, revogação do
object URL e cancelamento da consulta de exportação ao desmontar.

Consultas e exportação binária podem ser canceladas. Operações já enviadas de
criação, edição, exclusão, login ou recuperação não têm rollback garantido por
um cleanup. A proteção desta etapa deve impedir feedback/navegação local de uma
tentativa que já perdeu seu dono, sem afirmar que desfez a operação no servidor
ou Firebase. Uma mutação válida ainda ativa deve manter sua conclusão normal.

### RF-08 — Dependências e lifecycle dos efeitos

Revisar cada `useEffect`, incluindo efeitos de foco da etapa 2, listeners de
`matchMedia`, opções, Context, polling e formulários. As dependências devem
corresponder aos valores lidos; cálculos derivados simples continuam na
renderização e eventos continuam nos handlers.

Usar callbacks estáveis quando necessários aos efeitos existentes e preservar as
justificativas de `useCallback`/`useMemo`. A revisão não deve silenciar regras
de dependências para evitar uma execução legítima.

Em `StrictMode`, a sequência adicional de setup/cleanup pode iniciar e cancelar
uma primeira consulta. O critério é restar um ciclo ativo válido após a
estabilização e nenhum recurso após desmontar, não exigir uma única chamada
inicial em desenvolvimento.

## 5. Arquivos afetados e entregas

| Arquivo ou área                                           | Ação esperada                                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/context/AuthContext.tsx`                             | Agrupar restauração/sessão, preservar API e conferir cleanup.                          |
| `src/hooks/useAuthActions.ts`                             | Agrupar operação e erros, mantendo o comportamento da etapa 2.                         |
| `src/hooks/usePasswordReset.ts`                           | Agrupar fase e feedback; derivar loading/sucesso.                                      |
| `src/hooks/useAiUsage.ts`                                 | Agrupar estado da consulta, proteger polling e troca de página.                        |
| `src/hooks/useHerdReports.ts`                             | Revisar estado das opções/download e associação com a listagem.                        |
| `src/hooks/usePaginatedResource.ts`                       | Preservar reducer; testar e corrigir lacunas comprovadas.                              |
| Hooks de usuários, acessos, propriedades, perfil e opções | Verificar URL, cancelamento, retry e respostas antigas.                                |
| Drawers, `DeleteButton`, sidebar e páginas consumidoras   | Alterar somente se o inventário ou os testes demonstrarem necessidade.                 |
| `tests/`                                                  | Acrescentar testes de concorrência, polling, cleanup, formulários e regressão.         |
| `tests/reactDom.ts`                                       | Reutilizar o helper existente; estender apenas para rerender/unmount se necessário.    |
| `docs/ETAPA-3-ESTADOS-E-EFEITOS.md`                       | Registrar o inventário final, decisões, cenários, resultados e limitações na execução. |
| Spec, plano e REQUISITOS.md                               | Registrar a entrega e atualizar status somente após validação.                         |

O documento de inventário é uma entrega futura da execução desta spec. Tipos
locais de apresentação permanecem junto ao hook/componente; entidades de domínio
continuam em `src/types/`. As 45 verificações existentes da etapa 2 devem
continuar passando.

## 6. Critérios de aceite

| ID    | Cenário                                                                         | Resultado esperado                                                                                                                         |
| ----- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| CA-01 | Inventário completo do estado                                                   | Cada conjunto tem decisão justificada; estados correlacionados agrupados, independentes preservados e nenhuma mutação direta identificada. |
| CA-02 | Restauração pendente, sem usuário, com sucesso ou falha                         | Context apresenta a fase correta, libera a inicialização e mantém perfil/header coerentes.                                                 |
| CA-03 | Restauração resolve/rejeita depois de desmontar                                 | Nenhuma alteração tardia de estado ou Authorization pelo efeito abandonado.                                                                |
| CA-04 | Login e recuperação inválidos, válidos, falhos e com retry                      | Contratos da etapa 2 preservados; sem loading/sucesso/erros contraditórios.                                                                |
| CA-05 | Logout falha e depois é repetido com sucesso                                    | Primeiro mantém sessão/rota e mostra erro; depois limpa a sessão e retorna ao login.                                                       |
| CA-06 | Consulta A é substituída por B e termina depois de B                            | Dados/metadados de B permanecem; sucesso e falha tardios de A são ignorados.                                                               |
| CA-07 | Consulta desmontada cujo transporte ignora abort                                | Signal abortado; resultado tardio não altera o consumidor nem agenda trabalho novo.                                                        |
| CA-08 | Página/tamanho atuais e reload do reducer                                       | Seleção atual não reinicia loading; reload faz nova tentativa e descarta a resposta substituída.                                           |
| CA-09 | Usuários/acessos com URL ausente, válida e inválida; navegação por histórico    | Consulta e página exibidas acompanham a rota válida, sem loops ou parâmetro indefinido.                                                    |
| CA-10 | Exclusão do último usuário na página 2 e desativação equivalente de propriedade | Página anterior carregada; URL de usuários atualizada sem retorno à página vazia.                                                          |
| CA-11 | Alteração de fazenda com relatório anterior pendente                            | Primeira página do novo filtro; resposta antiga ignorada; download continua ligado à linha selecionada.                                    |
| CA-12 | Polling de IA com resposta pendente e conclusão                                 | Sem segundo polling enquanto pendente; próximo ciclo somente 30 segundos após concluir.                                                    |
| CA-13 | Polling de IA falha após sucesso                                                | Última resposta da mesma página e sua data permanecem; interface identifica dados desatualizados.                                          |
| CA-14 | Troca de página, retry e desmontagem durante polling                            | Sem linhas/data da página anterior, resposta tardia ignorada e nenhum timer remanescente após unmount.                                     |
| CA-15 | Opções carregam durante fechar/reabrir drawer                                   | Ciclo antigo cancelado; resultado tardio não sobrescreve as opções atuais; retry funciona.                                                 |
| CA-16 | Trocar registro de edição após erros e tentar fechar durante envio              | Campos/erros do registro anterior limpos; fechamento bloqueado durante envio e dados preservados após falha.                               |
| CA-17 | Exclusão/desativação falha e é repetida                                         | Confirmação conserva erro/abertura, exibe loading e só fecha após sucesso.                                                                 |
| CA-18 | Download ativo, segunda ação e desmontagem                                      | Segundo envio bloqueado; exportação abandonada não inicia download; object URL criado é liberado.                                          |
| CA-19 | Montar/reexecutar/desmontar efeitos em StrictMode                               | Nenhum ciclo, listener ou timer duplicado após estabilizar; nenhum recurso ativo após desmontar.                                           |
| CA-20 | Regressão e verificações finais                                                 | Testes anteriores e novos, lint e build aprovados; APIs públicas, validação e organização preservadas.                                     |

## 7. Estratégia de testes e evidências

1. Usar a infraestrutura de testes da etapa 2 e os hooks/componentes/Context
   reais. Simular apenas SDK, services, transporte e relógio nas fronteiras
   necessárias.
2. Controlar promises para resolver/rejeitar consultas em ordem escolhida,
   inclusive após abort. Verificar o resultado observado na interface ou na API
   pública do hook.
3. Usar timers simulados do Vitest no polling, avançando o relógio com React
   `act` e resolvendo explicitamente as promises. Evitar esperas reais de 30
   segundos.
4. Verificar AbortSignal, remoção de listeners e quantidade de ciclos ativos,
   incluindo StrictMode. Ausência de warning de React não prova cleanup.
5. Exercitar URL real em MemoryRouter e Ant Design real nos cenários de
   formulário e confirmação. Estender os fixtures existentes, sem implementar um
   simulador de hooks.
6. Começar pelos cenários que demonstram a lacuna encontrada e acrescentar a
   menor proteção necessária. Não criar testes que apenas repitam as unions ou a
   implementação de setters.
7. Executar `npm test`, `npm run lint`, `npm run build` e `git diff --check`.
   Registrar os totais efetivamente executados; 45 é a base, não uma meta de
   quantidade.

No inventário/evidências, registrar branch e commit/estado de trabalho,
arquivo/efeito, dependências, recurso criado, cleanup, cenário executado,
resultado e limitações. Testes com jsdom não comprovam layout, navegação com
leitor de tela ou integração com Firebase/backend reais; essas verificações
continuam na etapa 6.

## 8. Ordem de implementação

- [x] Registrar a base e o inventário de todos os estados e efeitos, com
      decisões por conjunto.
- [x] Agrupar Context, ações de autenticação e recuperação; manter os testes e
      contratos da etapa 2.
- [x] Agrupar/revisar consulta de IA e polling; testar relógio, stale data,
      troca de página e cleanup.
- [x] Revisar consultas, reducer, paginação/URL, opções e relatório/download com
      promises controladas.
- [x] Conferir formulários, confirmações, listeners e efeitos de foco; corrigir
      apenas lacunas demonstradas.
- [x] Executar cenários normais e em StrictMode, testar o conjunto e registrar
      evidências reproduzíveis.
- [x] Atualizar esta spec, o inventário, o plano e REQUISITOS.md com o resultado
      real.

## 9. Condição de conclusão

O6 e O7 só podem ser marcados como cumpridos após o inventário completo e a
execução dos critérios CA-01 a CA-20, com rastreabilidade entre cenário e
evidência. Código existente que já atende deve ser preservado e registrado como
tal.

A execução comprova os comportamentos desta etapa com React real e serviços
simulados, mantendo a distinção para validação integrada da etapa 6. O registro
abaixo descreve o resultado da execução.

## 10. Registro da execução — 2 de novembro de 2026

**O6 e O7 cumpridos no escopo da spec.** Inventário, decisões para todos os
conjuntos e correspondência dos 20 critérios estão em
[ETAPA-3-ESTADOS-E-EFEITOS.md](../docs/ETAPA-3-ESTADOS-E-EFEITOS.md).

- Context, ações de autenticação, recuperação, IA e download receberam estados
  agrupados e indicadores derivados. As APIs públicas e o reducer existente
  foram preservados.
- Foram corrigidas navegação de exclusão após sair da tela e mensagens/callbacks
  de drawers, confirmação e status após desmontagem ou troca de registro. Os
  testes reproduziram essas falhas antes das correções.
- Inventário: 47 para 33 chamadas de useState, um reducer preservado e quatro
  formulários Ant Design preservados. Os 23 efeitos finais possuem dependências
  explícitas e cleanup quando criam recursos/operadores locais. A contagem não é
  métrica de performance.
- `npm test`: **95 testes aprovados** (10 Node + 85 Vitest), incluindo os 45
  testes da etapa 2. `npm run lint`, `npm run build` e `git diff --check`:
  aprovados. O build conserva avisos de diretivas `use client` das dependências.
- Nenhuma dependência nova. Os testes usam React/Ant Design reais, jsdom,
  promises controladas e timers simulados; SDK e services/transporte são
  simulados nas fronteiras descritas nos testes.
- A versão avaliada é `feat/scrum-230`, sobre `8d994de`, com alterações locais
  das etapas 1 a 3, ainda sem commit da entrega.

Firebase/backend reais, conferência visual em navegador e leitor de tela
permanecem na etapa 6. O acompanhamento passa a **21 itens atendidos, 2 parciais
e 1 não atendido**, estimativa de **91,7%**. O11/E10 continuam parciais e E5
permanece não atendido.
