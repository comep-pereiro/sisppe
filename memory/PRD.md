# PRD - COMEP (Conselho Municipal de Educação de Pereiro)

## Data: 2026-03-21

## Problem Statement Original
Criar um site para o Conselho Municipal de Educação de Pereiro - COMEP para monitoramento das escolas da rede municipal, baseado no modelo do SISP do CEE-CE (sisp.cee.ce.gov.br).

## User Personas
1. **Escola** - Gestores escolares da rede municipal
2. **Administrador COMEP** - Funcionários do conselho municipal de educação

## Core Requirements
- Login de escolas com Código de Censo + CPF + Senha
- Login administrativo para funcionários do COMEP
- Cadastro de solicitações de novas escolas
- Dashboard de monitoramento para escolas e admins
- Gestão de corpo docente (CRUD)
- Gestão de quadro administrativo (CRUD)
- Listagem e análise de solicitações de cadastro
- Relatórios em PDF
- Notificações para escolas desatualizadas
- Dashboard com gráficos de evolução

## What's Been Implemented

### Backend (FastAPI + MongoDB)
- ✅ Sistema de autenticação JWT (escola e admin)
- ✅ CRUD completo de escolas
- ✅ CRUD de docentes
- ✅ CRUD de quadro administrativo
- ✅ Sistema de solicitações de cadastro (aprovar/rejeitar)
- ✅ Dashboard stats APIs
- ✅ Seed de dados de teste
- ✅ **Recuperação de senha com token e email** (NEW)
- ✅ **Geração de relatórios PDF (individual e geral)** (NEW)
- ✅ **Sistema de notificações para escolas desatualizadas** (NEW)
- ✅ **API de evolução mensal para gráficos** (NEW)
- ✅ **Envio de emails via Resend** (configurado, precisa de API key)

### Frontend (React + Shadcn UI)
- ✅ Página de login escola (split-screen design)
- ✅ Página de login admin
- ✅ Página de solicitação de cadastro
- ✅ Página de recuperação de senha
- ✅ Dashboard da escola
- ✅ Dashboard do administrador com gráficos (Recharts)
- ✅ Gestão de docentes (lista, criar, editar, remover)
- ✅ Gestão de quadro administrativo
- ✅ Listagem de escolas (admin)
- ✅ Detalhes de escola com tabs
- ✅ Listagem e análise de solicitações
- ✅ **Página de Relatórios PDF** (NEW)
- ✅ **Página de Notificações** (NEW)
- ✅ **Gráficos de evolução e distribuição** (NEW)

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

## Credenciais de Teste
- Admin: admin@comep.gov.br / admin123
- Escola: 23456789 (censo) / 12345678900 (cpf) / escola123 (senha)

## Prioritized Backlog
### P0 (Crítico) - Implementado ✅
- Sistema de login
- Dashboard básico
- CRUD de entidades
- Relatórios PDF
- Notificações de atualização
- Gráficos de evolução

### P1 (Alta Prioridade)
- Configurar chave API do Resend para emails em produção
- Dashboard com mais métricas detalhadas

### P2 (Média Prioridade)
- Integração com sistemas estaduais
- Sistema de auditoria de alterações

## Next Tasks
1. Configurar RESEND_API_KEY no ambiente de produção para habilitar envio de emails
2. Adicionar mais escolas para demonstração
3. Implementar filtros avançados nos relatórios
