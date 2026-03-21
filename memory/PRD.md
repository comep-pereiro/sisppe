# PRD - COMEP (Conselho Municipal de Educação de Pereiro)

## Data: 2026-03-21 (Atualizado)

## Problem Statement Original
Criar um site para o Conselho Municipal de Educação de Pereiro - COMEP para monitoramento das escolas da rede municipal, baseado no modelo do SISP do CEE-CE (sisp.cee.ce.gov.br).

O sistema deve permitir que secretários escolares alimentem informações reais das escolas seguindo o formulário oficial do SISP, com campos formatados (CPF, telefone, CEP) e opção de editar/excluir informações.

## User Personas
1. **Escola** - Gestores escolares (Diretores e Secretários) da rede municipal
2. **Administrador COMEP** - Funcionários do conselho municipal de educação

## Core Requirements
- Login de escolas com Código INEP + CPF + Senha
- Login administrativo para funcionários do COMEP
- Formulário completo de dados da escola conforme SISP
- Gestão de dependências físicas (salas, laboratórios)
- Gestão de mobiliário e equipamentos por condição
- Gestão completa de professores (dados pessoais + formação + atribuições)
- Sistema de bloqueio/desbloqueio de escolas para análise

## Status: COMPLETO - FASE 1

Todas as funcionalidades da Fase 1 foram implementadas e testadas.

## What's Been Implemented

### Backend (FastAPI + MongoDB)
- ✅ Sistema de autenticação JWT (escola e admin)
- ✅ Autenticação multi-usuário por escola (Diretor + Secretário)
- ✅ CRUD completo de escolas com campos expandidos
- ✅ CRUD de Dependências Físicas
- ✅ CRUD de Mobiliário/Equipamento (por condição: Excelente, Bom, Regular, Péssimo)
- ✅ CRUD completo de Professores (dados pessoais + formações + atribuições)
- ✅ Sistema de bloqueio/desbloqueio de escolas
- ✅ Seed de dados com 18 escolas reais de Pereiro-CE
- ✅ Geração de relatórios PDF
- ✅ Sistema de notificações

### Frontend (React + Shadcn UI)
- ✅ Página de login escola (split-screen design) com Código INEP
- ✅ Página de login admin
- ✅ **Ficha Escolar** - Formulário completo com 4 tabs:
  - Identificação (CNPJ, Ato de Criação, Mantenedora)
  - Endereço (CEP, Rua, Bairro, Município)
  - Contato (Telefone, Fax, Email)
  - Características (Área, Internet, Características especiais)
- ✅ **Dependências Físicas** - CRUD com resumo (Total, Área, Tipos)
- ✅ **Mobiliário/Equipamento** - CRUD com quantidades por condição
- ✅ **Professores** - CRUD completo com:
  - Dados Pessoais (CPF, RG, Contato, Endereço)
  - Dados Profissionais (Vínculo, Função, Carga Horária)
  - Formações (Graduação, Especialização, etc.)
  - Atribuições (Etapa, Disciplina, Dias, Habilitação)
- ✅ Dashboard da escola com estatísticas
- ✅ Dashboard do admin com gráficos
- ✅ Inputs com máscaras (CPF, CNPJ, Telefone, CEP)

### Formatação de Campos
- CPF: 123.456.789-00
- CNPJ: 07.570.518/0001-00
- Telefone: (88) 99999-9999
- CEP: 63460-000

## Credenciais de Teste
- **Admin:** admin@comep.gov.br / admin123
- **Escola (exemplo):** Código INEP: 23056797 / CPF: 05174591 / Senha: 123456

## 18 Escolas Cadastradas
Todas as 18 escolas da rede municipal de Pereiro-CE com dados reais.

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
│   ├── server.py       # API principal (rotas expandidas)
│   ├── services.py     # Serviços (email, PDF)
│   └── .env
└── frontend/
    └── src/
        ├── pages/
        │   ├── FichaEscolar.jsx        # NOVO
        │   ├── DependenciasFisicas.jsx # NOVO
        │   ├── MobiliarioEquipamento.jsx # NOVO
        │   ├── Professores.jsx         # NOVO
        │   └── ...
        ├── components/
        │   └── ui/
        │       └── masked-input.jsx    # NOVO
        ├── utils/
        │   └── formatters.js           # NOVO
        └── ...
```

## Novas Coleções MongoDB
- `dependencias_fisicas`: Salas, laboratórios, espaços físicos
- `mobiliario_equipamento`: Inventário com condição
- `docentes_completos`: Professores com formações e atribuições

## Test Results (2026-03-21)
- **Backend:** 100% (todas APIs funcionando)
- **Frontend:** 100% (todos os fluxos UI funcionando)
- **Report:** /app/test_reports/iteration_5.json

## URLs
- **Aplicação:** https://pereiro-escolas.preview.emergentagent.com
- **API Health:** https://pereiro-escolas.preview.emergentagent.com/api/health

## Próximas Fases (Backlog)

### Fase 2 - Organização do Ensino
- [ ] Gestão de Turmas (Etapa, Modalidade, Turno, Alunos)
- [ ] Vínculo entre Professores e Turmas
- [ ] Matriz Curricular

### Fase 3 - Biblioteca e Documentos
- [ ] Gestão do Acervo (Categorias, Títulos, Quantidades)
- [ ] Upload de Documentos (Regimento, PPP, etc.)
- [ ] Anexos por Professor/Diretor

### P1 (Alta Prioridade)
- Configurar domínio de email para envio de notificações em produção
- Relatórios PDF com dados expandidos

### P2 (Média Prioridade)
- Integração com sistemas estaduais (CEE-CE)
- Sistema de auditoria de alterações
- Exportação de dados para Excel
