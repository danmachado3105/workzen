# WorkZen

> Sistema de gestão e agendamento para prestadores de serviços.

O **WorkZen** é uma aplicação SaaS em desenvolvimento com o objetivo de facilitar a gestão de clientes, serviços e agendamentos para profissionais que trabalham com atendimento por horário.

O projeto está sendo desenvolvido como uma aplicação completa, com **backend, frontend, banco de dados, autenticação e infraestrutura**, seguindo uma arquitetura organizada e preparada para evolução.

---

## 🚧 Status do projeto

**Em desenvolvimento — MVP funcional**

A estrutura principal do sistema já está implementada e funcionando de ponta a ponta.

### Progresso geral

- [x] Estrutura inicial do projeto
- [x] Backend
- [x] Banco de dados
- [x] Migrations
- [x] Autenticação JWT
- [x] API de clientes
- [x] API de serviços
- [x] API de agendamentos
- [x] Dashboard
- [x] Frontend React + TypeScript
- [x] Login
- [x] Cadastro
- [x] Proteção de rotas
- [x] CRUD de clientes
- [x] CRUD de serviços
- [x] Gerenciamento de agendamentos
- [x] Integração frontend ↔ backend
- [x] Validações de entrada
- [x] CORS
- [x] Dependências com versões fixadas
- [x] Revisão técnica do backend
- [ ] Polimento visual do frontend
- [ ] Melhorias de UX
- [ ] Revisão de responsividade
- [ ] Testes finais do frontend
- [ ] Preparação para produção
- [ ] Deploy
- [ ] Publicação do MVP

---

# 🏗️ Stack

## Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT
- Docker
- Docker Compose
- Pytest

## Frontend

- React
- TypeScript
- Vite
- React Router
- CSS

---

# 📁 Estrutura

```text
WORKZEN/
│
├── backend/
│   ├── app/
│   │   ├── appointments/
│   │   ├── clients/
│   │   ├── services/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── tests/
│   ├── alembic/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# ⚙️ Backend

O backend é responsável pela API, autenticação, regras de negócio e persistência dos dados.

### Principais módulos

### Authentication

Sistema de autenticação utilizando JWT.

Fluxo atual:

```text
Cadastro
   ↓
Login
   ↓
JWT
   ↓
Frontend
   ↓
Authorization: Bearer <token>
```

### Clients

Gerenciamento de clientes vinculados ao usuário autenticado.

Operações principais:

- Listar
- Criar
- Atualizar
- Desativar

### Services

Gerenciamento dos serviços oferecidos pelo prestador.

Informações principais:

- Nome
- Preço
- Duração
- Status

### Appointments

Gerenciamento dos agendamentos.

Informações principais:

- Cliente
- Serviço
- Data/hora
- Valor cobrado
- Status
- Status do pagamento

O cancelamento possui uma rota específica e as transições de status são controladas pelo backend.

### Dashboard

O backend fornece informações utilizadas pelo dashboard, incluindo:

- Clientes ativos
- Serviços ativos
- Agendamentos do dia
- Próximos agendamentos
- Agendamentos concluídos
- Agendamentos cancelados
- Faturamento total
- Faturamento do mês

---

# 🖥️ Frontend

O frontend foi construído com React + TypeScript e atualmente já está integrado ao backend.

### Telas implementadas

- Login
- Cadastro
- Dashboard
- Clientes
- Serviços
- Agendamentos

### Autenticação

O frontend possui:

- `AuthContext`
- armazenamento do JWT
- proteção de rotas
- logout
- tratamento de sessão
- envio automático do token nas requisições

---

# 🧪 Testes

A API possui testes automatizados utilizando Pytest.

Na última validação:

```text
39 passed
3 warnings
```

Os testes cobrem, entre outros pontos:

- autenticação;
- clientes;
- serviços;
- agendamentos;
- dashboard;
- validações de entrada;
- regras de status dos agendamentos.

Os warnings existentes não estão relacionados às últimas alterações.

---

# 🔐 Segurança e qualidade

Durante a revisão técnica do backend foram corrigidos pontos importantes:

- [x] Rotação do `SECRET_KEY`
- [x] `.env` removido do rastreamento atual do Git
- [x] `.venv` removido do rastreamento
- [x] `.gitignore` atualizado
- [x] CORS configurado
- [x] Dependências diretas com versões fixadas
- [x] Validações de entrada adicionadas
- [x] Transições de status de agendamento restringidas

> O histórico antigo do Git não foi reescrito após a rotação do secret. A chave comprometida foi invalidada.

---

# 📌 Decisões importantes

### Status de agendamento

O `PUT /appointments/{id}` não deve ser utilizado para alterar livremente o status do agendamento.

Atualmente:

```text
scheduled
    │
    └──→ canceled
```

O cancelamento utiliza uma rota específica.

A funcionalidade de marcar um agendamento como `completed` ainda não foi implementada e está registrada como possível evolução futura.

---

# 🚀 Roadmap

## Fase 1 — Fundação

- [x] Estrutura do monorepo
- [x] Docker
- [x] PostgreSQL
- [x] FastAPI
- [x] SQLAlchemy
- [x] Alembic
- [x] Configuração de ambiente

## Fase 2 — Backend

- [x] Autenticação
- [x] Clientes
- [x] Serviços
- [x] Agendamentos
- [x] Dashboard
- [x] Validações
- [x] CORS
- [x] Revisão técnica
- [x] Testes automatizados

## Fase 3 — Frontend

- [x] React + TypeScript + Vite
- [x] Sistema de rotas
- [x] Autenticação
- [x] Dashboard
- [x] Clientes
- [x] Serviços
- [x] Agendamentos
- [x] Integração com API

## Fase 4 — Polimento

- [ ] Design system
- [ ] Responsividade
- [ ] Loading states
- [ ] Empty states
- [ ] Mensagens de erro
- [ ] Feedback de sucesso
- [ ] Melhorias de formulários
- [ ] Acessibilidade básica
- [ ] Revisão geral de UX

## Fase 5 — Produção

- [ ] Revisão final
- [ ] Configuração de ambiente de produção
- [ ] Deploy do backend
- [ ] Deploy do frontend
- [ ] Banco PostgreSQL em produção
- [ ] Configuração de domínio
- [ ] HTTPS
- [ ] Testes em produção
- [ ] Publicação do MVP

---

# 🎯 Objetivo do MVP

A primeira versão do WorkZen deve permitir que um prestador:

```text
Criar conta
    ↓
Fazer login
    ↓
Cadastrar clientes
    ↓
Cadastrar serviços
    ↓
Criar agendamentos
    ↓
Acompanhar os agendamentos
    ↓
Gerenciar sua operação pelo Dashboard
```

---

# 🔮 Próximas evoluções

Após o MVP, algumas funcionalidades poderão ser avaliadas:

- Marcar agendamento como concluído
- Calendário visual
- Notificações
- Lembretes de agendamento
- Integração com WhatsApp
- Relatórios
- Mais métricas no Dashboard
- Configurações do estabelecimento
- Página pública de agendamento
- Multiusuário/equipe
- Planos pagos

Essas funcionalidades **não fazem parte da primeira versão** e só serão consideradas depois que o MVP estiver estável.

---

## 📈 Momento atual

**WorkZen está com o núcleo funcional implementado.**

O próximo objetivo é deixar o frontend mais refinado, consistente e responsivo antes de partir para a preparação do ambiente de produção e o deploy.

> **Status atual: MVP funcional → Polimento → Produção**