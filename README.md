# WorkZen

> Gestão de clientes, serviços e agendamentos para prestadores de serviços.

O WorkZen é um MVP SaaS para profissionais que atendem por horário. Ele centraliza clientes, serviços, agenda e o acompanhamento de pagamentos em uma interface web responsiva, com API própria e banco PostgreSQL.

## 🎬 Preview

Uma pequena demonstração do **Workzen** em funcionamento:

https://github.com/user-attachments/assets/e88184b2-71d9-473c-98e4-8d5089c958d4

## ✨ Funcionalidades

- Cadastro, login, logout e sessão autenticada com JWT.
- Perfil do usuário com atualização de nome.
- Dashboard com indicadores da operação, receita recebida, status e próximos agendamentos.
- Gestão de clientes: criar, editar e desativar sem apagar agendamentos relacionados.
- Gestão de serviços: criar, editar e desativar sem apagar agendamentos relacionados.
- Agenda com criação, edição, listagem por período e detalhes de agendamentos.
- Prevenção de conflitos de horário considerando a duração do serviço.
- Cancelamento e conclusão de atendimentos com transições controladas.
- Controle de pagamento pendente ou pago e valor cobrado independente do preço atual do serviço.
- Isolamento dos dados por usuário autenticado.
- Configurações de perfil e preferência de tema Dark/Light persistida no navegador.
- Estados de carregamento, vazio, erro, confirmações e toasts de feedback.

## 🖥️ Interface

A interface preserva uma identidade escura em grafite/preto com verde-lima como cor de destaque. O tema claro usa os mesmos tokens visuais para manter a mesma linguagem do produto. A navegação principal fica na sidebar, que se adapta para uma barra horizontal em telas menores.

As telas de Dashboard, Agenda, Clientes, Serviços e Configurações foram construídas para uso em desktop e mobile, com componentes compartilhados para botões, diálogos, estados vazios, carregamento e notificações.

## 🛠️ Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Axios e CSS com design tokens |
| Backend | Python 3, FastAPI, SQLAlchemy, Alembic, Pydantic Settings e Uvicorn |
| Segurança | JWT (`python-jose`), hash de senha com passlib/bcrypt e CORS configurável |
| Banco de dados | PostgreSQL (com `psycopg2-binary`) |
| Infraestrutura | Docker e Docker Compose |
| Qualidade | Pytest, TypeScript e Oxlint |

## 🏗️ Arquitetura

```text
React + TypeScript
        ↓ Axios
FastAPI (routers por domínio)
        ↓
Services (regras de negócio)
        ↓ SQLAlchemy
PostgreSQL
```

O backend é organizado por domínio em `auth`, `clients`, `services`, `appointments` e `dashboard`. Cada domínio separa router, schema, service e, quando necessário, model. As migrations do banco são mantidas pelo Alembic.

## 📁 Estrutura do projeto

```text
workzen/
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── appointments/
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── dashboard/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── docker-compose.yml
└── README.md
```

## 🚀 Como executar

### Pré-requisitos

- Docker Desktop com Docker Compose.
- Node.js compatível com o Vite para executar o frontend.
- Python 3.12, caso queira executar o backend fora do Docker.

### 1. Configure as variáveis locais

Crie os dois arquivos de ambiente a partir dos exemplos:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

No Windows PowerShell, o equivalente é:

```powershell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
```

Os valores de exemplo já configuram a comunicação local entre Docker, API e Vite. Antes de usar fora do ambiente local, substitua as credenciais e URLs pelos valores do ambiente correspondente.

### 2. Inicie PostgreSQL e API com Docker Compose

```bash
docker compose up --build
```

O Compose deste repositório é voltado ao desenvolvimento: monta o código do backend e executa o Uvicorn com `--reload`. Em outro terminal, aplique as migrations:

```bash
docker compose exec backend alembic upgrade head
```

A API fica disponível em `http://localhost:8000`. Verifique a prontidão em:

```text
GET http://localhost:8000/health
```

### 3. Inicie o frontend

```bash
cd frontend
npm install
npm run dev
```

O Vite informa no terminal a URL local, normalmente `http://localhost:5173`.

### Backend fora do Docker (opcional)

Com um PostgreSQL acessível e o `.env` da raiz configurado:

```bash
cd backend
python -m venv .venv
# Ative o ambiente virtual conforme seu sistema operacional
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## 🔐 Variáveis de ambiente

O backend lê o arquivo `.env` da raiz do repositório. O frontend usa `frontend/.env` no desenvolvimento e incorpora `VITE_API_URL` durante o build.

| Variável | Uso | Obrigatória |
| --- | --- | --- |
| `DATABASE_URL` | URL de conexão SQLAlchemy/PostgreSQL | Sim, backend |
| `POSTGRES_USER` | Usuário do PostgreSQL do Docker Compose | Sim, Compose |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL do Docker Compose | Sim, Compose |
| `POSTGRES_DB` | Nome do banco do Docker Compose | Sim, Compose |
| `SECRET_KEY` | Assinatura dos tokens JWT | Sim, backend |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula | Sim, backend |
| `VITE_API_URL` | URL base pública da API no frontend | Sim, frontend |
| `ALGORITHM` | Algoritmo JWT; padrão `HS256` | Não |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duração do token; padrão `60` | Não |

Nunca versione `.env` nem use valores de exemplo em produção. `CORS_ORIGINS` exige origens explícitas; o curinga `*` não é aceito.

## 🧪 Testes e qualidade

A suíte backend possui **66 testes coletados**, cobrindo autenticação, validações, isolamento por usuário, clientes, serviços, agenda, conflitos de horário, dashboard, configuração e health check.

Com o Compose em execução:

```bash
docker compose exec backend pytest
```

Ou com o ambiente Python local configurado:

```bash
cd backend
pytest
```

Para o frontend:

```bash
cd frontend
npm run lint
npm run build
```

O comando de build também executa a verificação de tipos (`tsc -b`) antes de gerar `frontend/dist`.

## 🐳 Docker e runtime de produção

O `backend/Dockerfile` é destinado ao runtime da API em produção. A imagem instala as dependências, executa como usuário sem privilégios e, no `entrypoint.sh`, aplica `alembic upgrade head` antes de iniciar o Uvicorn.

Com um PostgreSQL já disponível para o container, construa e execute a API assim:

```bash
docker build -t workzen-api ./backend
docker run --rm -p 8000:8000 --env-file .env workzen-api
```

Nesse cenário, `DATABASE_URL` deve apontar para o PostgreSQL acessível pelo container. O Dockerfile entrega apenas o runtime da API; o repositório não contém configuração de hospedagem estática para o build do frontend.

## 🔒 Segurança

Os mecanismos presentes no projeto incluem:

- Autenticação por JWT e expiração configurável do token.
- Senhas armazenadas como hash usando passlib/bcrypt.
- Dependências de autenticação e filtros por `user_id` para isolar dados entre contas.
- CORS configurado por ambiente com origens explícitas.
- Segredos e URLs de conexão obtidos por variáveis de ambiente.
- Health check que consulta o banco antes de retornar sucesso e não expõe o erro interno de conexão.

## 📱 Responsividade e acessibilidade

- Layout responsivo para desktop e mobile, incluindo sidebar adaptável e controles de gestão em coluna em telas pequenas.
- Tema Dark/Light persistido em `localStorage`, com transições que respeitam `prefers-reduced-motion`.
- Estados de foco visível, feedback de carregamento e mensagens de erro acessíveis.
- Diálogos com `Escape`, foco inicial, retenção de foco por `Tab` e restauração do foco anterior.
- Controles de seleção expõem seu estado com atributos ARIA; ícones decorativos são ocultados de leitores de tela.

## 📌 Status do projeto

O MVP está implementado e preparado para iniciar o deploy. O repositório não está em produção e ainda requer a configuração da infraestrutura, domínio e variáveis de ambiente da plataforma escolhida.

## 🗺️ Próximos passos

As possibilidades abaixo são ideias futuras e **não fazem parte da versão atual**:

- Notificações e lembretes.
- Integração com WhatsApp.
- Página pública de agendamento.
- Múltiplos profissionais ou equipes.
- Relatórios avançados.
- Pagamentos online.

## 👨‍💻 Autor

Danilo Machado
