# Olha o Ponto - Sistema de Ponto Eletrônico

Um sistema completo de ponto eletrônico desenvolvido com a stack MERN (MongoDB, Express, React, Node.js) e Tailwind CSS.

## Funcionalidades

- **Autenticação:** Login e registro para empresas (Admin) e funcionários.
- **Módulo do Funcionário:**
  - Dashboard para registro de ponto (Entrada, Pausa, Retorno, Saída).
  - Histórico de pontos com localização (Geolocalização).
- **Módulo Administrativo:**
  - Dashboard com estatísticas em tempo real.
  - Gestão de funcionários (CRUD).
  - Relatórios de ponto com filtros por data.
- **Monetização (Preparado):**
  - Estrutura de planos (Gratuito, Básico, Profissional, Empresarial).
  - Limite de funcionários baseado no plano.

## Configuração do Ambiente

Para rodar a aplicação, você precisa configurar as seguintes variáveis de ambiente no painel de **Secrets** do AI Studio (ou criar um arquivo `.env` localmente):

```env
# URL de conexão com o MongoDB (Obrigatório)
MONGODB_URI="mongodb+srv://usuario:senha@cluster.mongodb.net/olha-o-ponto"

# Chave secreta para assinatura dos tokens JWT (Opcional, tem um valor padrão)
JWT_SECRET="sua-chave-secreta-super-segura"
```

> **Nota:** Se a variável `MONGODB_URI` não for fornecida, o servidor tentará conectar em `mongodb://localhost:27017/olha-o-ponto`, o que pode falhar no ambiente de preview em nuvem.

## Deploy Rápido em Produção

Se a prioridade é **subir e vender rápido**, o caminho mais simples para este projeto hoje é:

1. **Deploy monolítico no Render**
- O frontend React e o backend Express já funcionam juntos no mesmo serviço.
- Isso evita configurar CORS, proxy, domínio separado e URLs diferentes para a API.

2. **Banco no MongoDB Atlas**
- Use um cluster dedicado do Atlas para produção.

3. **Mercado Pago em produção**
- Configure as credenciais reais da sua aplicação Mercado Pago.
- Defina `APP_URL` com a URL pública do seu app para que os retornos do checkout e webhooks funcionem corretamente.

### Variáveis obrigatórias para produção

```env
APP_URL="https://seu-dominio-ou-servico.onrender.com"
MONGODB_URI="mongodb+srv://usuario:senha@cluster.mongodb.net/olha-o-ponto"
JWT_SECRET="uma-chave-longa-e-segura"
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
RESEND_API_KEY="re_..."
EMAIL_FROM="Olha o Ponto <no-reply@seudominio.com>"
```

### Variáveis opcionais

```env
MERCADO_PAGO_PUBLIC_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
SUPPORT_EMAIL=
```

### Passo a passo no Render

1. Suba este projeto para um repositório GitHub.
2. No Render, crie um novo serviço Web usando o repositório.
3. Você pode usar o arquivo `render.yaml` deste projeto ou configurar manualmente:
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
4. Configure as variáveis de ambiente obrigatórias.
5. Faça o primeiro deploy.
6. Depois do deploy, copie a URL pública gerada pelo Render e coloque essa mesma URL em `APP_URL`.
7. Refaça o deploy para garantir que o Mercado Pago use as URLs corretas de retorno e notificação.

### Reset de senha por email

- A aplicação já suporta envio real de email para recuperação de senha usando **Resend**.
- Para ativar em produção, configure:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
- Funcionários que esquecerem o acesso não recebem reset automático: eles enviam uma solicitação ao administrador, e o admin pode receber isso no painel e por email.

### Mercado Pago em produção

- Garanta que `APP_URL` esteja em **https**.
- Confirme na aplicação do Mercado Pago que a conta está usando as credenciais corretas de produção.
- Faça um pagamento real de baixo valor ou um fluxo completo em ambiente aprovado antes de abrir vendas.

### Recomendação comercial

- Para começar a vender, publique primeiro em um domínio Render ou domínio próprio único.
- Só depois, se quiser otimizar marketing/performance, vale separar frontend e backend.

## Deploy no Netlify

O usuário mencionou "inicialmente vou subir no netilify". Como esta é uma aplicação Full-Stack (MERN), o Netlify é ideal para hospedar o **Frontend (React)**. Para o **Backend (Node.js/Express)**, você precisará de um serviço como Render, Heroku ou Railway.

### Passos para separar e fazer o deploy:

1. **Frontend (Netlify):**
   - Configure o comando de build como `npm run build`.
   - O diretório de publicação deve ser `dist`.
   - Adicione uma variável de ambiente `VITE_API_URL` apontando para a URL do seu backend.
   - Atualize as chamadas `fetch('/api/...')` para usar a `VITE_API_URL`.

2. **Backend (Render/Railway):**
   - Hospede a pasta do servidor Node.js.
   - Configure as variáveis `MONGODB_URI` e `JWT_SECRET`.
   - Certifique-se de configurar o CORS para permitir requisições do domínio do Netlify.

No ambiente atual, a aplicação roda como um monólito (Express servindo o Vite em desenvolvimento e os arquivos estáticos em produção), o que torna o deploy em um único serviço a opção mais rápida e segura para colocar no ar.

## Checklist Go-Live de 10 Minutos

1. Confirmar `APP_URL` com a URL pública final em `https`.
2. Confirmar `MONGODB_URI` apontando para o cluster de produção.
3. Definir `JWT_SECRET` forte e exclusivo.
4. Configurar `MERCADO_PAGO_ACCESS_TOKEN` de produção.
5. Configurar `RESEND_API_KEY` e `EMAIL_FROM`.
6. Fazer deploy no Render e validar `GET /api/health`.
7. Testar cadastro de uma empresa real.
8. Testar email de recuperação de senha do admin.
9. Testar solicitação de acesso de funcionário e recebimento pelo admin.
10. Testar um fluxo completo de checkout do Mercado Pago antes de abrir vendas.

## Variáveis no Render

Use o arquivo [production.env.example](/home/adriano/Área%20de%20Trabalho/projects/olha-o-ponto/production.env.example) como referência.

### Obrigatórias

- `APP_URL`
- `MONGODB_URI`
- `JWT_SECRET`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM`

### Recomendadas

- `MERCADO_PAGO_PUBLIC_KEY`
- `SUPPORT_EMAIL`

### Opcionais

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `MERCADO_PAGO_CLIENT_ID`
- `MERCADO_PAGO_CLIENT_SECRET`

### Ordem para preencher no Render

1. `APP_URL`
2. `MONGODB_URI`
3. `JWT_SECRET`
4. `MERCADO_PAGO_ACCESS_TOKEN`
5. `MERCADO_PAGO_PUBLIC_KEY`
6. `RESEND_API_KEY`
7. `EMAIL_FROM`
8. `SUPPORT_EMAIL`
9. Variáveis opcionais restantes, se for usar
# olha-o-ponto
