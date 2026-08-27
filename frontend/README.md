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

O backend fornece informações