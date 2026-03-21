# PRD - COMEP (Conselho Municipal de Educação de Pereiro)

## Data: 2026-03-21 (Atualizado)

## Problem Statement Original
Criar um site para o Conselho Municipal de Educação de Pereiro - COMEP para monitoramento das escolas da rede municipal, baseado no modelo do SISP do CEE-CE (sisp.cee.ce.gov.br).

## User Personas
1. **Escola** - Gestores escolares (Diretores e Secretários) da rede municipal
2. **Administrador COMEP** - Funcionários do conselho municipal de educação

## Core Requirements
- Login de escolas com Código INEP + CPF + Senha
- Login administrativo para funcionários do COMEP
- Cadastro de solicitações de novas escolas
- Dashboard de monitoramento para escolas e admins
- Gestão de corpo docente (CRUD)
- Gestão de quadro administrativo (CRUD)
- Listagem e análise de solicitações de cadastro
- Relatórios em PDF
- Notificações para escolas desatualizadas
- Dashboard com gráficos de evolução
- Sistema de bloqueio/desbloqueio de escolas para análise pelo COMEP

## Status: COMPLETO

Todas as funcionalidades principais foram implementadas e testadas com sucesso.

## What's Been Implemented

### Backend (FastAPI + MongoDB)
- ✅ Sistema de autenticação JWT (escola e admin)
- ✅ Autenticação multi-usuário por escola (Diretor + Secretário)
- ✅ CRUD completo de escolas
- ✅ CRUD de docentes com isolamento de dados
- ✅ CRUD de quadro administrativo com isolamento de dados
- ✅ Sistema de solicitações de cadastro (aprovar/rejeitar)
- ✅ Dashboard stats APIs
- ✅ Seed de dados com 18 escolas reais de Pereiro-CE
- ✅ Recuperação de senha com token e email
- ✅ Geração de relatórios PDF (individual e geral)
- ✅ Sistema de notificações para escolas desatualizadas
- ✅ API de evolução mensal para gráficos
- ✅ Sistema de bloqueio/desbloqueio de escolas
- ✅ Envio de emails via Resend (configurado)

### Frontend (React + Shadcn UI)
- ✅ Página de login escola (split-screen design) com Código INEP
- ✅ Página de login admin
- ✅ Página de solicitação de cadastro
- ✅ Página de recuperação de senha
- ✅ Dashboard da escola com estatísticas
- ✅ Dashboard do administrador com gráficos (Recharts)
- ✅ Gestão de docentes (lista, criar, editar, remover)
- ✅ Gestão de quadro administrativo
- ✅ Listagem de escolas (admin) com busca e filtros
- ✅ Detalhes de escola com tabs e lista de usuários
- ✅ Botões de bloqueio/desbloqueio na página de detalhes
- ✅ Listagem e análise de solicitações
- ✅ Página de Relatórios PDF
- ✅ Página de Notificações
- ✅ Gráficos de evolução e distribuição

### Design
- Cores institucionais: Teal (#0F766E) primário
- Fontes: Manrope (títulos), Inter (corpo)
- Layout: Split-screen login, sidebar dashboard

### Emails (configurado para Resend)
- Email: protocolocomep@pereiro.ce.gov.br
- Templates HTML para:
  - Recuperação de senha
  - Aprovação de cadastro
  - Rejeição de cadastro
  - Lembrete de atualização (escolas 90+ dias sem atualizar)
  - Notificação de bloqueio/desbloqueio

## Credenciais de Teste
- **Admin:** admin@comep.gov.br / admin123
- **Escola (exemplo):** Código INEP: 23056797 / CPF: 05174591 / Senha: 123456

## 18 Escolas Cadastradas
Todas as 18 escolas da rede municipal de Pereiro-CE estão cadastradas com dados reais:
- CEIs (Centros de Educação Infantil)
- EEIEFs (Escolas de Ensino Infantil e Fundamental)
- EMEFs (Escolas Municipais de Ensino Fundamental)

## Arquitetura Técnica

### Backend
- **Framework:** FastAPI
- **Banco de Dados:** MongoDB (via motor)
- **Autenticação:** JWT
- **Geração de PDF:** ReportLab
- **Envio de Email:** Resend

### Frontend
- **Framework:** React 18
- **UI Components:** Shadcn/UI
- **Estilização:** Tailwind CSS
- **Gráficos:** Recharts
- **Roteamento:** React Router

### Estrutura de Pastas
```
/app/
├── backend/
│   ├── server.py       # API principal
│   ├── services.py     # Serviços (email, PDF)
│   └── .env            # Variáveis de ambiente
└── frontend/
    └── src/
        ├── pages/      # Componentes de página
        ├── components/ # Componentes UI (Shadcn)
        ├── context/    # AuthContext
        └── services/   # API client
```

## Test Results (2026-03-21)
- **Backend:** 100% (25/25 testes passaram)
- **Frontend:** 100% (todos os fluxos UI funcionando)
- **Report:** /app/test_reports/iteration_4.json

## URLs
- **Aplicação:** https://pereiro-escolas.preview.emergentagent.com
- **API Health:** https://pereiro-escolas.preview.emergentagent.com/api/health

## Backlog Futuro

### P1 (Alta Prioridade)
- Verificar domínio de email personalizado para envio de emails em produção
- Dashboard com mais métricas detalhadas

### P2 (Média Prioridade)
- Integração com sistemas estaduais (CEE-CE)
- Sistema de auditoria de alterações
- Exportação de dados para Excel
- Relatórios personalizados por período
