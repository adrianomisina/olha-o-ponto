# Relatório Final de QA

## Resumo
- Bugs encontrados: 8
- Bugs corrigidos: 8
- Bugs pendentes: 0 bloqueantes
- Ambiente validado com banco em memória (`mongodb-memory-server`)

## Bugs corrigidos
1. `npm start` quebrava após o build
- Severidade: Crítico
- Evidência: `ReferenceError: exports is not defined in ES module scope`
- Causa: servidor compilado em CommonJS sendo executado em pacote com `"type": "module"`.
- Correção: geração de `dist/package.json` com `"type": "commonjs"` no build.

2. `npm start` subia em modo de desenvolvimento
- Severidade: Alto
- Evidência: inicialização do Vite middleware e erro de WebSocket no start de produção.
- Causa: script de start não definia `NODE_ENV=production`.
- Correção: atualização do script `start`.

3. Fluxo de convite de funcionário quebrado após cadastro da empresa
- Severidade: Alto
- Passos para reproduzir:
  - cadastrar uma empresa/admin;
  - tentar montar o link de convite com `companyId` vindo do usuário autenticado.
- Comportamento esperado: `companyId` disponível e link funcional.
- Comportamento atual: `companyId` ausente; `/api/auth/company/undefined` retornava erro.
- Correção: inclusão de `companyId` na resposta de `/api/auth/register`.

4. Recuperação de senha gerava link inválido sem `APP_URL`
- Severidade: Alto
- Evidência: log com `undefined/reset-password/<token>`.
- Correção: fallback para `req.protocol + host` em `/api/auth/forgot-password`.

5. Callback de pagamento dependia de `APP_URL` sem fallback
- Severidade: Médio
- Risco: URLs de retorno e webhook inválidas em ambiente local ou mal configurado.
- Correção: fallback para URL derivada da requisição em `/api/payments/create-preference`.

6. Dashboard do funcionário quebraria ao carregar ajustes pendentes
- Severidade: Médio
- Causa: frontend tratava resposta paginada (`{ adjustments, total... }`) como array simples.
- Correção: leitura de `data.adjustments` com fallback seguro.

7. Filtro de relatórios chamava a busca com o evento do clique
- Severidade: Médio
- Causa: `onClick={fetchReports}` em vez de chamar o handler correto.
- Correção: botão ligado a `handleFilter`.

8. Simulação de pagamento da tela administrativa quebrava
- Severidade: Médio
- Evidência: chamada da UI terminava em `500` ao postar diretamente no webhook.
- Causa: a interface usava o webhook do Mercado Pago como endpoint de simulação local.
- Correção: rota autenticada de simulação para ambiente não produtivo e ajuste da UI de pagamentos.

## Testes executados
- `npm install`
- `npm run lint`
- `npm run build`
- `npm run test:qa`
- `PORT=3201 npm start`
- `GET /api/health`
- Fluxos de API validados:
  - cadastro de admin
  - lookup de empresa por ID
  - cadastro de funcionário por convite
  - login de funcionário
  - registro de ponto
  - solicitação e aprovação de ajuste
  - relatórios admin
  - solicitação de acesso de funcionário e resolução pelo admin
  - simulação de pagamento em ambiente não produtivo

## Arquivos alterados
- `package.json`
- `server/routes/auth.ts`
- `server/routes/payments.ts`
- `server/models/AccessRequest.ts`
- `src/pages/employee/Dashboard.tsx`
- `src/pages/admin/Reports.tsx`
- `src/pages/admin/Payments.tsx`
- `src/pages/admin/Approvals.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/Login.tsx`
- `tests/api-regression.test.mjs`
- `tests/production-safety.test.mjs`
- `qa-log.md`
- `test-plan.md`

## Pendências e recomendações
- Não houve validação visual em navegador real neste ambiente; geolocalização, notificações push e checkout Mercado Pago ficaram validados por código, inspeção de UI e smoke tests, não por interação completa em browser real.
- O bundle frontend continua grande no build; vale considerar code-splitting para reduzir o warning do Vite.
- Recomendo expandir a suíte automatizada para cobrir:
  - login e proteção de rotas;
  - CRUD de funcionários;
  - ajustes de ponto de ponta a ponta;
  - smoke tests visuais de pagamentos, relatórios e configurações via Playwright.
