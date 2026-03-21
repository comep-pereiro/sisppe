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

## What's Been Implemented

### Backend (FastAPI + MongoDB)
- ✅ Sistema de autenticação JWT (escola e admin)
- ✅ CRUD completo de escolas
- ✅ CRUD de docentes
- ✅ CRUD de quadro administrativo
- ✅ Sistema de solicitações de cadastro (aprovar/rejeitar)
- ✅ Dashboard stats APIs
- ✅ Seed de dados de teste

### Frontend (React + Shadcn UI)
- ✅ Página de login escola (split-screen design)
- ✅ Página de login admin
- ✅ Página de solicitação de cadastro
- ✅ Página de recuperação de senha
- ✅ Dashboard da escola
- ✅ Dashboard do administrador
- ✅ Gestão de docentes (lista, criar, editar, remover)
- ✅ Gestão de quadro administrativo
- ✅ Listagem de escolas (admin)
- ✅ Detalhes de escola com tabs
- ✅ Listagem e análise de solicitações

### Design
- Cores institucionais: Teal (#0F766E) primário
- Fontes: Manrope (títulos), Inter (corpo)
- Layout: Split-screen login, sidebar dashboard

## Credenciais de Teste
- Admin: admin@comep.gov.br / admin123
- Escola: 23456789 (censo) / 12345678900 (cpf) / escola123 (senha)

## Prioritized Backlog
### P0 (Crítico) - Implementado ✅
- Sistema de login
- Dashboard básico
- CRUD de entidades

### P1 (Alta Prioridade)
- Relatórios em PDF
- Notificações por email
- Histórico de alterações

### P2 (Média Prioridade)
- Dashboard com gráficos avançados
- Exportação de dados
- Integração com sistemas estaduais

## Next Tasks
1. Implementar envio de emails para recuperação de senha
2. Adicionar relatórios em PDF
3. Dashboard com gráficos de evolução
4. Sistema de notificações
