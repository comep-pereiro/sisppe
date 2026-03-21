# PRD - SISPPe (Sistema de Informatização e Simplificação de Processos de Pereiro)

## Data: 2026-03-21 (Versão Final)

## Problem Statement Original
Criar um site para o Conselho Municipal de Educação de Pereiro - COMEP para monitoramento das escolas da rede municipal, baseado no modelo do SISP do CEE-CE.

## Status: COMPLETO E FUNCIONAL

## Credenciais de Teste
| Tipo | Login | Senha |
|------|-------|-------|
| Escola | INEP: 23056797, CPF: 05174591 | 123456 |
| Admin | admin@comep.gov.br | admin123 |

## URL: https://pereiro-escolas.preview.emergentagent.com

## What's Been Implemented

### Sistema de Autenticação
- Login de escolas (Código INEP + CPF + Senha)
- Login administrativo (COMEP)
- Multi-usuário por escola (Diretor + Secretário)
- JWT com validação robusta

### Ficha Escolar
- Identificação (CNPJ, Ato de Criação, Mantenedora)
- Endereço (CEP, Rua, Bairro, Município)
- Contato (Telefone, Fax, Email)
- Características (Área, Internet, Características especiais)
- Formatação automática de campos (CPF, CNPJ, Telefone, CEP)

### Dependências Físicas
- CRUD completo de salas, laboratórios, banheiros, etc.
- Resumo por tipo e área total

### Mobiliário/Equipamento
- Inventário por condição (Excelente, Bom, Regular, Péssimo)
- Totais automáticos

### Professores - Sistema Completo de Lotação
- **Dados Pessoais**: CPF, RG, Contato, Endereço
- **Dados Profissionais**: Vínculo, Função, Carga Horária
- **Formações**: Graduação, Especialização, Mestrado, Doutorado
- **Lotação em Sala de Aula**:
  - Etapa/Nível (Educação Infantil, Fundamental, EJA)
  - Ano/Série (dinâmico por etapa):
    - Ed. Infantil: CRECHE I/II/III, PRÉ I/II
    - Fund. Anos Iniciais: 1º ao 5º ANO
    - Fund. Anos Finais: 6º ao 9º ANO
    - EJA: EJA I/II/III/IV
  - Turma (A, B, C, D, E, ÚNICA)
  - Turno (MANHÃ, TARDE, NOITE, INTEGRAL)
  - Componente Curricular
  - Carga Horária Semanal
  - Habilitação (Habilitado/Não Habilitado)
  - Dias da Semana

### Upload de Documentos
- **Documentos de Gestão**: PPP, Regimento, Matrizes Curriculares, Calendário, Atas
- **Documentos de Docentes**: Diplomas, Certificados, Autorizações
- Armazenamento via Emergent Object Storage
- Validação de tipos (PDF, DOC, DOCX, JPG, PNG)
- Download e exclusão

### Painel Administrativo (COMEP)
- Dashboard com estatísticas e gráficos
- Lista de escolas com filtros
- Sistema de bloqueio/desbloqueio para análise
- Geração de relatórios PDF
- Sistema de notificações

## Melhorias de Robustez
- Timeout de 30s em requisições
- Tratamento de erros de rede
- Validação de dados no AuthContext
- Proteção contra dados corrompidos no localStorage
- Helpers de validação no backend

## Arquitetura Técnica

### Backend
- **Framework:** FastAPI
- **Banco de Dados:** MongoDB
- **Autenticação:** JWT
- **Armazenamento:** Emergent Object Storage
- **PDF:** ReportLab
- **Email:** Resend

### Frontend
- **Framework:** React 18
- **UI:** Shadcn/UI + Tailwind CSS
- **Gráficos:** Recharts
- **Roteamento:** React Router

## 18 Escolas Cadastradas
Todas as escolas da rede municipal de Pereiro-CE.

## Test Results (2026-03-21)
- **Backend:** 100% (43 testes passaram)
- **Frontend:** 100% (todos os fluxos funcionando)
- **Report:** /app/test_reports/iteration_7.json

## Hospedagem
Configurado para GitHub Pages conforme solicitado.

## Backlog Futuro (P2)
- Organização do Ensino (Turmas, Modalidades)
- Biblioteca (Acervo de Livros)
- Escrituração (para o futuro, conforme mencionado pelo usuário)
- Integração com CEE-CE
- Relatórios PDF expandidos
