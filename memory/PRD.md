# PRD - SISPPe (Sistema de Informatização e Simplificação de Processos de Pereiro)

## Data: 2026-03-21 (Atualizado)

## Problem Statement Original
Criar um site para o Conselho Municipal de Educação de Pereiro - COMEP para monitoramento das escolas da rede municipal, baseado no modelo do SISP do CEE-CE (sisp.cee.ce.gov.br).

O sistema foi nomeado **SISPPe - Sistema de Informatização e Simplificação de Processos de Pereiro**.

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
- **Upload de documentos de gestão (PPP, Regimento, Matrizes Curriculares)**
- **Upload de documentos de docentes (diplomas, certificados)**
- Sistema de bloqueio/desbloqueio de escolas para análise

## Status: COMPLETO

Todas as funcionalidades foram implementadas e testadas.

## What's Been Implemented

### Backend (FastAPI + MongoDB + Object Storage)
- ✅ Sistema de autenticação JWT (escola e admin)
- ✅ Autenticação multi-usuário por escola (Diretor + Secretário)
- ✅ CRUD completo de escolas com campos expandidos
- ✅ CRUD de Dependências Físicas
- ✅ CRUD de Mobiliário/Equipamento (por condição: Excelente, Bom, Regular, Péssimo)
- ✅ CRUD completo de Professores (dados pessoais + formações + atribuições)
- ✅ **Upload de Documentos de Gestão** (PPP, Regimento, Matrizes, etc.)
- ✅ **Upload de Documentos de Docentes** (diplomas, certificados, etc.)
- ✅ Sistema de bloqueio/desbloqueio de escolas
- ✅ Seed de dados com 18 escolas reais de Pereiro-CE
- ✅ Geração de relatórios PDF
- ✅ Sistema de notificações

### Frontend (React + Shadcn UI)
- ✅ Página de login escola (split-screen design) - **SISPPe**
- ✅ Página de login admin
- ✅ **Ficha Escolar** - Formulário completo com 4 tabs
- ✅ **Dependências Físicas** - CRUD com resumo
- ✅ **Mobiliário/Equipamento** - CRUD com quantidades por condição
- ✅ **Professores** - CRUD completo com formações e atribuições
- ✅ **Documentos de Gestão** - Upload/Download/Exclusão de documentos
- ✅ Dashboard da escola com estatísticas
- ✅ Dashboard do admin com gráficos
- ✅ Inputs com máscaras (CPF, CNPJ, Telefone, CEP)

### Formatação de Campos
- CPF: 123.456.789-00
- CNPJ: 07.570.518/0001-00
- Telefone: (88) 99999-9999
- CEP: 63460-000

### Tipos de Documentos de Gestão
1. ATA DE APROVAÇÃO DO REGIMENTO ESCOLAR
2. REGIMENTO ESCOLAR
3. PROJETO POLÍTICO PEDAGÓGICO (PPP)
4. MATRIZ CURRICULAR - EDUCAÇÃO INFANTIL
5. MATRIZ CURRICULAR - ENSINO FUNDAMENTAL ANOS INICIAIS
6. MATRIZ CURRICULAR - ENSINO FUNDAMENTAL ANOS FINAIS
7. MATRIZ CURRICULAR - EJA
8. PLANO DE GESTÃO
9. CALENDÁRIO ESCOLAR
10. ATA DO CONSELHO ESCOLAR
11. OUTROS

### Tipos de Documentos de Docentes
1. DIPLOMA DE GRADUAÇÃO
2. DIPLOMA DE ESPECIALIZAÇÃO
3. DIPLOMA DE MESTRADO
4. DIPLOMA DE DOUTORADO
5. CERTIFICADO DE CURSO
6. AUTORIZAÇÃO DE ENSINO
7. PARECER DO CEE
8. LAUDO MÉDICO
9. DECLARAÇÃO
10. OUTROS

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
- **Armazenamento:** Emergent Object Storage
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
│   ├── storage.py      # Módulo Object Storage
│   ├── services.py     # Serviços (email, PDF)
│   └── .env
└── frontend/
    └── src/
        ├── pages/
        │   ├── DocumentosGestao.jsx    # Upload de documentos
        │   ├── FichaEscolar.jsx
        │   ├── DependenciasFisicas.jsx
        │   ├── MobiliarioEquipamento.jsx
        │   ├── Professores.jsx
        │   └── ...
        ├── components/
        │   └── ui/
        │       └── masked-input.jsx
        ├── utils/
        │   └── formatters.js
        └── ...
```

## Coleções MongoDB
- `escolas`: Dados das instituições
- `usuarios_escola`: Diretores e secretários
- `docentes_completos`: Professores com formações e atribuições
- `dependencias_fisicas`: Salas, laboratórios, espaços físicos
- `mobiliario_equipamento`: Inventário com condição
- `documentos_gestao`: PPP, Regimento, Matrizes, etc.
- `documentos_docentes`: Diplomas, certificados, etc.
- `admins`: Funcionários do COMEP

## Test Results (2026-03-21)
- **Backend:** 100% (36/36 testes passaram)
- **Frontend:** 100% (todos os fluxos UI funcionando)
- **Report:** /app/test_reports/iteration_6.json

## URLs
- **Aplicação:** https://pereiro-escolas.preview.emergentagent.com
- **API Health:** https://pereiro-escolas.preview.emergentagent.com/api/health

## Hospedagem
O site será hospedado no **GitHub Pages** conforme solicitado pelo usuário.

## Backlog Futuro

### P1 (Alta Prioridade)
- Configurar domínio de email para envio de notificações em produção
- Relatórios PDF com dados expandidos (incluindo documentos)

### P2 (Média Prioridade)
- Organização do Ensino (Turmas, Modalidades, Turnos)
- Biblioteca (Acervo de Livros)
- Integração com sistemas estaduais (CEE-CE)
- Sistema de auditoria de alterações
- Exportação de dados para Excel
