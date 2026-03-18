# Plano de Testes QA

## Escopo
- Validar fluxos críticos do sistema Olha o Ponto no ambiente local.
- Cobrir autenticação, jornadas de administrador e funcionário, integrações internas de API e persistência básica.

## Cenários Críticos
1. Inicialização da aplicação
- Instalar dependências.
- Executar validação estática (`npm run lint`) e build (`npm run build`).
- Subir a aplicação localmente e validar `GET /api/health`.

2. Autenticação
- Cadastro de empresa/admin.
- Login de admin.
- Recuperação e redefinição de senha.
- Cadastro de funcionário por convite.
- Login de funcionário.
- Redirecionamentos por perfil e proteção de rotas.

3. Fluxos do funcionário
- Dashboard com carregamento de registros do dia.
- Registro de ponto com localização e observações.
- Histórico paginado.
- Solicitação de ajuste de ponto.
- Listagem de solicitações pendentes e históricas.

4. Fluxos do administrador
- Dashboard com métricas da empresa.
- Gestão de funcionários: listar, criar, importar em massa e remover.
- Link de convite.
- Aprovação e rejeição de ajustes.
- Relatórios com filtros e paginação.
- Configurações da empresa.
- Pagamentos/checkout: smoke test de carregamento e regressão visível.

5. Não funcionais
- Mensagens de erro e estados vazios.
- Compatibilidade básica entre payloads de frontend e backend.
- Regressões óbvias de usabilidade.

## Estratégia
- Priorizar testes automatizados locais via lint/build e chamadas HTTP reais.
- Complementar com inspeção de código para identificar incompatibilidades entre frontend e backend.
- Corrigir bugs de maior severidade e revalidar os cenários afetados.
