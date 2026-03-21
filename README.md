# SISPPe - Sistema de Informatização e Simplificação de Processos de Pereiro

Sistema de monitoramento das escolas da rede municipal de Pereiro-CE, desenvolvido para o Conselho Municipal de Educação (COMEP).

## 🚀 Tecnologias

### Backend
- **FastAPI** - Framework Python
- **MongoDB** - Banco de dados
- **JWT** - Autenticação
- **ReportLab** - Geração de PDFs

### Frontend
- **React 18** - Framework JavaScript
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes
- **Recharts** - Gráficos

---

## 📋 Pré-requisitos

- Python 3.9+
- Node.js 18+
- MongoDB (local ou Atlas)

---

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/sisppe.git
cd sisppe
```

### 2. Configure o Backend
```bash
cd backend

# Crie o ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Crie o arquivo .env
cp .env.example .env
# Edite o .env com suas configurações
```

### 3. Configure o Frontend
```bash
cd frontend

# Instale as dependências
npm install
# ou
yarn install

# Crie o arquivo .env
cp .env.example .env
# Edite o .env com suas configurações
```

---

## ⚙️ Variáveis de Ambiente

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=sisppe
JWT_SECRET=sua-chave-secreta-aqui
RESEND_API_KEY=sua-chave-resend (opcional)
EMERGENT_LLM_KEY=sua-chave-storage (opcional)
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 🏃 Executando

### Backend
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
npm start
# ou
yarn start
```

### Acessar
- Frontend: http://localhost:3000
- API: http://localhost:8001/api
- Docs API: http://localhost:8001/docs

---

## 👤 Credenciais Padrão

Após executar o seed (POST /api/seed):

| Tipo | Login | Senha |
|------|-------|-------|
| Admin | admin@comep.gov.br | admin123 |
| Escola | INEP: 23056797, CPF: 05174591 | 123456 |

---

## 📁 Estrutura do Projeto

```
sisppe/
├── backend/
│   ├── server.py          # API principal
│   ├── storage.py         # Upload de arquivos
│   ├── services.py        # Email e PDF
│   ├── requirements.txt   # Dependências
│   └── tests/             # Testes automatizados
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/         # Páginas React
│   │   ├── components/    # Componentes UI
│   │   ├── context/       # AuthContext
│   │   ├── services/      # API client
│   │   └── utils/         # Utilitários
│   └── package.json
│
└── README.md
```

---

## 📱 Funcionalidades

### Área da Escola
- ✅ Ficha Escolar (dados da instituição)
- ✅ Dependências Físicas (salas, laboratórios)
- ✅ Mobiliário e Equipamentos
- ✅ Professores com Lotação
- ✅ Quadro Administrativo
- ✅ Upload de Documentos de Gestão

### Área Administrativa (COMEP)
- ✅ Dashboard com estatísticas
- ✅ Lista de escolas
- ✅ Bloqueio/Desbloqueio de escolas
- ✅ Relatórios em PDF
- ✅ Notificações

---

## 📄 Licença

Este projeto foi desenvolvido para o COMEP - Conselho Municipal de Educação de Pereiro.

---

## 🤝 Suporte

Para dúvidas ou suporte, entre em contato com a equipe do COMEP.
