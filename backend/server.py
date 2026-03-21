from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Query, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

# Import services
from services import (
    send_email, 
    get_password_recovery_email, 
    get_escola_approved_email,
    get_escola_rejected_email,
    get_update_reminder_email,
    get_notification_summary_email,
    generate_escola_report_pdf,
    generate_escolas_summary_pdf,
    get_email_template
)

# Import storage
from storage import init_storage, put_object, get_object, generate_storage_path, get_mime_type

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'comep-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SISPPe - Sistema de Informatização e Simplificação de Processos de Pereiro")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ======================== MODELS ========================

class UsuarioEscolaBase(BaseModel):
    nome: str
    cpf: str
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    cargo: str  # Diretor, Secretário Escolar

class UsuarioEscolaCreate(UsuarioEscolaBase):
    escola_id: str
    senha: str

class UsuarioEscolaResponse(UsuarioEscolaBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    escola_id: str
    ativo: bool = True

class EscolaBase(BaseModel):
    codigo_inep: str  # Código INEP da escola
    nome: str
    endereco: str
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    modalidades: List[str] = []  # Infantil, Fundamental, EJA, etc.
    situacao: str = "ativa"  # ativa, inativa, em_analise

class EscolaCreate(EscolaBase):
    pass

class EscolaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    codigo_inep: str
    nome: str
    endereco: str
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    modalidades: List[str] = []
    situacao: str = "ativa"
    bloqueado: bool = False
    motivo_bloqueio: Optional[str] = None
    data_cadastro: str
    data_atualizacao: str

class EscolaLogin(BaseModel):
    codigo_inep: str
    cpf: str
    senha: str

class AdminBase(BaseModel):
    nome: str
    email: EmailStr
    cargo: str  # Presidente, Secretário, Conselheiro

class AdminCreate(AdminBase):
    senha: str

class AdminResponse(AdminBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    data_cadastro: str
    ativo: bool = True

class AdminLogin(BaseModel):
    email: str
    senha: str

class DocenteBase(BaseModel):
    nome: str
    cpf: str
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    formacao: str  # Graduação, Especialização, Mestrado, Doutorado
    disciplinas: List[str] = []
    carga_horaria: int = 40
    vinculo: str  # Efetivo, Contratado, Temporário

class DocenteCreate(DocenteBase):
    escola_id: str

class DocenteResponse(DocenteBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    escola_id: str
    data_cadastro: str
    ativo: bool = True

class QuadroAdminBase(BaseModel):
    nome: str
    cpf: str
    cargo: str  # Diretor, Vice-Diretor, Secretário, Coordenador
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    formacao: str

class QuadroAdminCreate(QuadroAdminBase):
    escola_id: str

class QuadroAdminResponse(QuadroAdminBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    escola_id: str
    data_cadastro: str
    ativo: bool = True

class SolicitacaoCadastro(BaseModel):
    codigo_censo: str
    nome_escola: str
    endereco: str
    telefone: Optional[str] = None
    email_escola: Optional[EmailStr] = None
    nome_responsavel: str
    cpf_responsavel: str
    email_responsavel: EmailStr
    justificativa: str

class SolicitacaoCadastroResponse(SolicitacaoCadastro):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: str  # pendente, aprovada, rejeitada
    data_solicitacao: str
    data_analise: Optional[str] = None
    observacao_analise: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str
    user_data: dict

class RecuperarSenhaRequest(BaseModel):
    email: str
    tipo: str  # escola ou admin

class RedefinirSenhaRequest(BaseModel):
    token: str
    nova_senha: str

class DashboardStats(BaseModel):
    total_escolas: int
    escolas_ativas: int
    escolas_em_analise: int
    total_docentes: int
    total_alunos_estimado: int
    solicitacoes_pendentes: int

# ======================== NOVOS MODELOS - FICHA ESCOLAR ========================

class DadosInstituicaoBase(BaseModel):
    """Dados completos da instituição conforme formulário SISP"""
    # Identificação
    codigo_censo: Optional[str] = None
    cnpj: Optional[str] = None
    numero_ato_criacao: Optional[str] = None
    data_ato_criacao: Optional[str] = None
    escolas_nucleadas: Optional[str] = None
    
    # Endereço
    cep: Optional[str] = None
    endereco: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    municipio: str = "PEREIRO"
    estado: str = "CEARÁ"
    crede: str = "11 - JAGUARIBE"
    
    # Contato
    telefone: Optional[str] = None
    fax: Optional[str] = None
    email: Optional[str] = None
    
    # Características
    acesso_internet: Optional[str] = None  # FIBRA ÓPTICA, ADSL, etc.
    sistema_escrituracao_informatizado: bool = False
    assentamento: bool = False
    quilombola: bool = False
    indigena: bool = False
    rural: bool = False
    
    # Dados físicos
    area_total_m2: Optional[float] = None
    qtd_dias_letivos: int = 200
    carga_horaria_semanal: int = 40
    tipo_escola: str = "Educação Básica"
    
    # Mantenedora
    mantenedora_cnpj: Optional[str] = None
    mantenedora_razao_social: Optional[str] = None
    mantenedora_nome_fantasia: Optional[str] = None
    mantenedora_endereco: Optional[str] = None
    mantenedora_telefone: Optional[str] = None
    mantenedora_email: Optional[str] = None
    tipo_mantenedora: str = "PÚBLICA"
    natureza_juridica: Optional[str] = None
    atividade_principal: Optional[str] = None

class DependenciaFisicaBase(BaseModel):
    """Dependências físicas da escola (salas, laboratórios, etc.)"""
    tipo: str  # SALA DE AULA, BIBLIOTECA, LABORATÓRIO, etc.
    quantidade: int = 1
    area_m2: Optional[float] = None
    anexo: Optional[int] = None
    observacao: Optional[str] = None

class DependenciaFisicaCreate(DependenciaFisicaBase):
    escola_id: str

class DependenciaFisicaResponse(DependenciaFisicaBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    escola_id: str

class MobiliarioEquipamentoBase(BaseModel):
    """Mobiliário e equipamentos da escola"""
    tipo: str  # AR-CONDICIONADO, CADEIRA, MESA, COMPUTADOR, etc.
    qtd_excelente: int = 0
    qtd_bom: int = 0
    qtd_regular: int = 0
    qtd_pessimo: int = 0
    observacao: Optional[str] = None

class MobiliarioEquipamentoCreate(MobiliarioEquipamentoBase):
    escola_id: str

class MobiliarioEquipamentoResponse(MobiliarioEquipamentoBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    escola_id: str
    qtd_total: int = 0

class FormacaoDocente(BaseModel):
    """Formação acadêmica do docente"""
    tipo: str  # GRADUAÇÃO, ESPECIALIZAÇÃO, MESTRADO, DOUTORADO
    curso: str
    instituicao: str
    ano_conclusao: Optional[int] = None
    registro: Optional[str] = None
    parecer: Optional[str] = None

class AtribuicaoDocente(BaseModel):
    """Atribuição de ensino do docente"""
    etapa: str  # ENSINO FUNDAMENTAL, EDUCAÇÃO INFANTIL, EJA
    turma: str  # 1° AO 5°, 6° AO 9°, etc.
    disciplina: str
    dias_semana: List[str] = []  # SEG, TER, QUA, QUI, SEX
    carga_horaria: int = 0
    habilitacao: str = "HABILITADO"  # HABILITADO, NÃO HABILITADO
    autorizacao: Optional[str] = None

class DocenteCompletoBase(BaseModel):
    """Modelo completo de docente conforme formulário SISP"""
    # Dados pessoais
    nome: str
    cpf: str
    rg: Optional[str] = None
    orgao_emissor: Optional[str] = None
    data_nascimento: Optional[str] = None
    sexo: Optional[str] = None
    estado_civil: Optional[str] = None
    naturalidade: Optional[str] = None
    
    # Contato
    telefone: Optional[str] = None
    celular: Optional[str] = None
    email: Optional[str] = None
    
    # Endereço
    cep: Optional[str] = None
    endereco: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    municipio: Optional[str] = None
    
    # Dados profissionais
    vinculo: str = "EFETIVO"  # EFETIVO, CONTRATADO, TEMPORÁRIO
    funcao: str = "PROFESSOR"  # PROFESSOR, COORDENADOR, etc.
    data_admissao: Optional[str] = None
    carga_horaria_semanal: int = 40
    
    # Formações (lista)
    formacoes: List[FormacaoDocente] = []
    
    # Atribuições (lista)
    atribuicoes: List[AtribuicaoDocente] = []

class DocenteCompletoCreate(DocenteCompletoBase):
    escola_id: str

class DocenteCompletoResponse(DocenteCompletoBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    escola_id: str
    data_cadastro: str
    ativo: bool = True

# ======================== MODELOS DE DOCUMENTOS ========================

# Tipos de documentos de gestão
TIPOS_DOCUMENTOS_GESTAO = [
    "ATA DE APROVAÇÃO DO REGIMENTO ESCOLAR",
    "REGIMENTO ESCOLAR",
    "PROJETO POLÍTICO PEDAGÓGICO (PPP)",
    "MATRIZ CURRICULAR - EDUCAÇÃO INFANTIL",
    "MATRIZ CURRICULAR - ENSINO FUNDAMENTAL ANOS INICIAIS",
    "MATRIZ CURRICULAR - ENSINO FUNDAMENTAL ANOS FINAIS",
    "MATRIZ CURRICULAR - EJA",
    "PLANO DE GESTÃO",
    "CALENDÁRIO ESCOLAR",
    "ATA DO CONSELHO ESCOLAR",
    "OUTROS"
]

class DocumentoBase(BaseModel):
    """Documento de gestão escolar"""
    tipo: str  # Tipo do documento (REGIMENTO, PPP, MATRIZ, etc.)
    descricao: Optional[str] = None  # Descrição adicional

class DocumentoResponse(DocumentoBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    escola_id: str
    nome_arquivo: str
    storage_path: str
    content_type: str
    tamanho: int
    data_cadastro: str
    is_deleted: bool = False

class DocumentoDocenteBase(BaseModel):
    """Documento anexado a um docente (diploma, certificado, etc.)"""
    tipo: str  # DIPLOMA, CERTIFICADO, AUTORIZAÇÃO, etc.
    descricao: Optional[str] = None

class DocumentoDocenteResponse(DocumentoDocenteBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    docente_id: str
    escola_id: str
    nome_arquivo: str
    storage_path: str
    content_type: str
    tamanho: int
    data_cadastro: str
    is_deleted: bool = False

# Tipos de documentos de docentes
TIPOS_DOCUMENTOS_DOCENTE = [
    "DIPLOMA DE GRADUAÇÃO",
    "DIPLOMA DE ESPECIALIZAÇÃO",
    "DIPLOMA DE MESTRADO",
    "DIPLOMA DE DOUTORADO",
    "CERTIFICADO DE CURSO",
    "AUTORIZAÇÃO DE ENSINO",
    "PARECER DO CEE",
    "LAUDO MÉDICO",
    "DECLARAÇÃO",
    "OUTROS"
]

# ======================== HELPERS ========================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, user_type: str) -> str:
    payload = {
        "sub": user_id,
        "type": user_type,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    return payload

async def get_current_escola(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "escola":
        raise HTTPException(status_code=403, detail="Acesso restrito a escolas")
    return payload

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return payload

# ======================== AUTH ROUTES ========================

@api_router.post("/auth/escola/login", response_model=TokenResponse)
async def login_escola(data: EscolaLogin):
    """Login for school users (Director or Secretary)"""
    # Find school by INEP code
    escola = await db.escolas.find_one({"codigo_inep": data.codigo_inep}, {"_id": 0})
    
    if not escola:
        raise HTTPException(status_code=401, detail="Código INEP não encontrado")
    
    if escola.get("situacao") != "ativa":
        raise HTTPException(status_code=403, detail="Escola não está ativa no sistema")
    
    # Find user by CPF linked to this school
    usuario = await db.usuarios_escola.find_one({
        "escola_id": escola["id"],
        "cpf": data.cpf.replace(".", "").replace("-", ""),
        "ativo": True
    }, {"_id": 0})
    
    if not usuario or not verify_password(data.senha, usuario.get("senha_hash", "")):
        raise HTTPException(status_code=401, detail="CPF ou senha inválidos")
    
    # Create token with user ID and escola ID
    token = create_token(usuario["id"], "escola")
    
    # Return user data with escola info
    user_data = {
        "id": usuario["id"],
        "nome": usuario["nome"],
        "cpf": usuario["cpf"],
        "cargo": usuario["cargo"],
        "email": usuario.get("email"),
        "escola_id": escola["id"],
        "escola_nome": escola["nome"],
        "escola_codigo_inep": escola["codigo_inep"]
    }
    
    return TokenResponse(
        access_token=token,
        user_type="escola",
        user_data=user_data
    )

async def get_current_escola_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current logged in school user with escola_id"""
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "escola":
        raise HTTPException(status_code=403, detail="Acesso restrito a usuários de escolas")
    
    # Get user details to get escola_id
    usuario = await db.usuarios_escola.find_one({"id": payload["sub"]}, {"_id": 0})
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return {**payload, "escola_id": usuario["escola_id"], "usuario": usuario}

@api_router.post("/auth/admin/login", response_model=TokenResponse)
async def login_admin(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    
    if not admin or not verify_password(data.senha, admin.get("senha_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not admin.get("ativo", True):
        raise HTTPException(status_code=403, detail="Conta desativada")
    
    token = create_token(admin["id"], "admin")
    admin_data = {k: v for k, v in admin.items() if k != "senha_hash"}
    
    return TokenResponse(
        access_token=token,
        user_type="admin",
        user_data=admin_data
    )

@api_router.post("/auth/recuperar-senha")
async def recuperar_senha(data: RecuperarSenhaRequest):
    """Send password recovery email"""
    if data.tipo == "escola":
        user = await db.escolas.find_one({"email": data.email}, {"_id": 0})
        nome = user.get("nome") if user else None
    else:
        user = await db.admins.find_one({"email": data.email}, {"_id": 0})
        nome = user.get("nome") if user else None
    
    if user:
        # Generate recovery token
        recovery_token = str(uuid.uuid4())
        expiry = datetime.now(timezone.utc) + timedelta(hours=2)
        
        # Save token to database
        await db.password_recovery.insert_one({
            "token": recovery_token,
            "email": data.email,
            "tipo": data.tipo,
            "user_id": user.get("id"),
            "expiry": expiry.isoformat(),
            "used": False
        })
        
        # Send email
        base_url = os.environ.get('FRONTEND_URL', 'https://pereiro-escolas.preview.emergentagent.com')
        html_content = get_password_recovery_email(nome, recovery_token, base_url)
        await send_email(data.email, "COMEP - Recuperação de Senha", html_content)
    
    # Always return same message for security
    return {"message": "Se o email estiver cadastrado, você receberá instruções para recuperação de senha"}

@api_router.post("/auth/redefinir-senha")
async def redefinir_senha(data: RedefinirSenhaRequest):
    """Reset password using recovery token"""
    recovery = await db.password_recovery.find_one({
        "token": data.token,
        "used": False
    }, {"_id": 0})
    
    if not recovery:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    
    # Check expiry
    expiry = datetime.fromisoformat(recovery["expiry"])
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Token expirado")
    
    # Update password
    senha_hash = hash_password(data.nova_senha)
    
    if recovery["tipo"] == "escola":
        await db.escolas.update_one(
            {"id": recovery["user_id"]},
            {"$set": {"senha_hash": senha_hash}}
        )
    else:
        await db.admins.update_one(
            {"id": recovery["user_id"]},
            {"$set": {"senha_hash": senha_hash}}
        )
    
    # Mark token as used
    await db.password_recovery.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Senha alterada com sucesso"}

# ======================== SOLICITAÇÃO CADASTRO ========================

@api_router.post("/solicitacoes", response_model=SolicitacaoCadastroResponse)
async def criar_solicitacao(data: SolicitacaoCadastro):
    # Check if escola already exists
    existing = await db.escolas.find_one({"codigo_censo": data.codigo_censo}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Escola já cadastrada com este código de censo")
    
    # Check if there's a pending request
    pending = await db.solicitacoes.find_one({
        "codigo_censo": data.codigo_censo,
        "status": "pendente"
    }, {"_id": 0})
    if pending:
        raise HTTPException(status_code=400, detail="Já existe uma solicitação pendente para este código de censo")
    
    now = datetime.now(timezone.utc).isoformat()
    solicitacao = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pendente",
        "data_solicitacao": now,
        "data_analise": None,
        "observacao_analise": None
    }
    
    await db.solicitacoes.insert_one(solicitacao)
    return SolicitacaoCadastroResponse(**{k: v for k, v in solicitacao.items() if k != "_id"})

@api_router.get("/solicitacoes", response_model=List[SolicitacaoCadastroResponse])
async def listar_solicitacoes(status: Optional[str] = None, current_admin: dict = Depends(get_current_admin)):
    query = {}
    if status:
        query["status"] = status
    
    solicitacoes = await db.solicitacoes.find(query, {"_id": 0}).sort("data_solicitacao", -1).to_list(1000)
    return [SolicitacaoCadastroResponse(**s) for s in solicitacoes]

@api_router.put("/solicitacoes/{solicitacao_id}/aprovar")
async def aprovar_solicitacao(solicitacao_id: str, senha_inicial: str, current_admin: dict = Depends(get_current_admin)):
    solicitacao = await db.solicitacoes.find_one({"id": solicitacao_id}, {"_id": 0})
    if not solicitacao:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    if solicitacao["status"] != "pendente":
        raise HTTPException(status_code=400, detail="Solicitação já foi analisada")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create escola
    escola = {
        "id": str(uuid.uuid4()),
        "codigo_censo": solicitacao["codigo_censo"],
        "nome": solicitacao["nome_escola"],
        "endereco": solicitacao["endereco"],
        "telefone": solicitacao.get("telefone"),
        "email": solicitacao.get("email_escola"),
        "cpf_responsavel": solicitacao["cpf_responsavel"],
        "senha_hash": hash_password(senha_inicial),
        "modalidades": [],
        "situacao": "ativa",
        "data_cadastro": now,
        "data_atualizacao": now
    }
    
    await db.escolas.insert_one(escola)
    
    # Update solicitacao
    await db.solicitacoes.update_one(
        {"id": solicitacao_id},
        {"$set": {"status": "aprovada", "data_analise": now}}
    )
    
    # Send approval email
    if solicitacao.get("email_responsavel"):
        html_content = get_escola_approved_email(
            solicitacao["nome_escola"],
            solicitacao["codigo_censo"],
            senha_inicial
        )
        await send_email(
            solicitacao["email_responsavel"],
            "COMEP - Cadastro Aprovado!",
            html_content
        )
    
    return {"message": "Solicitação aprovada e escola cadastrada com sucesso"}

@api_router.put("/solicitacoes/{solicitacao_id}/rejeitar")
async def rejeitar_solicitacao(solicitacao_id: str, observacao: str, current_admin: dict = Depends(get_current_admin)):
    solicitacao = await db.solicitacoes.find_one({"id": solicitacao_id}, {"_id": 0})
    if not solicitacao:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.solicitacoes.update_one(
        {"id": solicitacao_id},
        {"$set": {"status": "rejeitada", "data_analise": now, "observacao_analise": observacao}}
    )
    
    # Send rejection email
    if solicitacao.get("email_responsavel"):
        html_content = get_escola_rejected_email(
            solicitacao["nome_escola"],
            observacao
        )
        await send_email(
            solicitacao["email_responsavel"],
            "COMEP - Solicitação de Cadastro",
            html_content
        )
    
    return {"message": "Solicitação rejeitada"}

# ======================== ESCOLAS ========================

@api_router.get("/escolas", response_model=List[EscolaResponse])
async def listar_escolas(situacao: Optional[str] = None, current_admin: dict = Depends(get_current_admin)):
    query = {}
    if situacao:
        query["situacao"] = situacao
    
    escolas = await db.escolas.find(query, {"_id": 0}).sort("nome", 1).to_list(1000)
    return [EscolaResponse(**e) for e in escolas]

@api_router.get("/escolas/me", response_model=EscolaResponse)
async def get_minha_escola(current_user: dict = Depends(get_current_escola_user)):
    escola = await db.escolas.find_one({"id": current_user["escola_id"]}, {"_id": 0})
    if not escola:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    return EscolaResponse(**escola)

@api_router.put("/escolas/me")
async def atualizar_minha_escola(data: EscolaBase, current_user: dict = Depends(get_current_escola_user)):
    # Check if escola is blocked
    escola = await db.escolas.find_one({"id": current_user["escola_id"]}, {"_id": 0})
    if escola and escola.get("bloqueado"):
        raise HTTPException(
            status_code=403, 
            detail=f"Escola bloqueada para análise. Motivo: {escola.get('motivo_bloqueio', 'Em análise pelo COMEP')}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.escolas.update_one(
        {"id": current_user["escola_id"]},
        {"$set": {**data.model_dump(), "data_atualizacao": now}}
    )
    
    return {"message": "Dados atualizados com sucesso"}

@api_router.get("/escolas/{escola_id}", response_model=EscolaResponse)
async def get_escola(escola_id: str, current_admin: dict = Depends(get_current_admin)):
    escola = await db.escolas.find_one({"id": escola_id}, {"_id": 0})
    if not escola:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    return EscolaResponse(**escola)

@api_router.put("/escolas/{escola_id}/situacao")
async def atualizar_situacao_escola(escola_id: str, situacao: str, current_admin: dict = Depends(get_current_admin)):
    if situacao not in ["ativa", "inativa", "em_analise"]:
        raise HTTPException(status_code=400, detail="Situação inválida")
    
    now = datetime.now(timezone.utc).isoformat()
    result = await db.escolas.update_one(
        {"id": escola_id},
        {"$set": {"situacao": situacao, "data_atualizacao": now}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    
    return {"message": "Situação atualizada com sucesso"}

# ======================== DOCENTES ========================

async def get_escola_id_from_user(current_user: dict) -> str:
    """Helper to get escola_id from current user"""
    if current_user.get("type") == "admin":
        return None
    # For escola users, get escola_id from usuarios_escola
    usuario = await db.usuarios_escola.find_one({"id": current_user["sub"]}, {"_id": 0})
    if usuario:
        return usuario["escola_id"]
    return None

async def check_escola_bloqueada(escola_id: str):
    """Check if escola is blocked and raise exception if so"""
    escola = await db.escolas.find_one({"id": escola_id}, {"_id": 0})
    if escola and escola.get("bloqueado"):
        raise HTTPException(
            status_code=403, 
            detail=f"Escola bloqueada para análise. Motivo: {escola.get('motivo_bloqueio', 'Em análise pelo COMEP')}"
        )

@api_router.post("/docentes", response_model=DocenteResponse)
async def criar_docente(data: DocenteCreate, current_user: dict = Depends(get_current_user)):
    # Get escola_id for escola users
    user_escola_id = await get_escola_id_from_user(current_user)
    
    # Escola can only add to their own, admin can add to any
    if current_user.get("type") == "escola":
        if data.escola_id != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode adicionar docentes à sua própria escola")
        # Check if blocked
        await check_escola_bloqueada(user_escola_id)
    
    now = datetime.now(timezone.utc).isoformat()
    docente = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "data_cadastro": now,
        "ativo": True
    }
    
    await db.docentes.insert_one(docente)
    return DocenteResponse(**{k: v for k, v in docente.items() if k != "_id"})

@api_router.get("/docentes", response_model=List[DocenteResponse])
async def listar_docentes(escola_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"ativo": True}
    
    # Get escola_id for escola users
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        # Escola users can only see their own docentes
        query["escola_id"] = user_escola_id
    elif escola_id:
        # Admin can filter by escola_id
        query["escola_id"] = escola_id
    
    docentes = await db.docentes.find(query, {"_id": 0}).sort("nome", 1).to_list(1000)
    return [DocenteResponse(**d) for d in docentes]

@api_router.put("/docentes/{docente_id}")
async def atualizar_docente(docente_id: str, data: DocenteBase, current_user: dict = Depends(get_current_user)):
    docente = await db.docentes.find_one({"id": docente_id}, {"_id": 0})
    if not docente:
        raise HTTPException(status_code=404, detail="Docente não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if docente["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode editar docentes da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.docentes.update_one(
        {"id": docente_id},
        {"$set": data.model_dump()}
    )
    
    return {"message": "Docente atualizado com sucesso"}

@api_router.delete("/docentes/{docente_id}")
async def remover_docente(docente_id: str, current_user: dict = Depends(get_current_user)):
    docente = await db.docentes.find_one({"id": docente_id}, {"_id": 0})
    if not docente:
        raise HTTPException(status_code=404, detail="Docente não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if docente["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode remover docentes da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.docentes.update_one({"id": docente_id}, {"$set": {"ativo": False}})
    return {"message": "Docente removido com sucesso"}

# ======================== QUADRO ADMINISTRATIVO ========================

@api_router.post("/quadro-admin", response_model=QuadroAdminResponse)
async def criar_quadro_admin(data: QuadroAdminCreate, current_user: dict = Depends(get_current_user)):
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if data.escola_id != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode adicionar membros à sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    now = datetime.now(timezone.utc).isoformat()
    membro = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "data_cadastro": now,
        "ativo": True
    }
    
    await db.quadro_admin.insert_one(membro)
    return QuadroAdminResponse(**{k: v for k, v in membro.items() if k != "_id"})

@api_router.get("/quadro-admin", response_model=List[QuadroAdminResponse])
async def listar_quadro_admin(escola_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"ativo": True}
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        # Escola users can only see their own quadro
        query["escola_id"] = user_escola_id
    elif escola_id:
        query["escola_id"] = escola_id
    
    membros = await db.quadro_admin.find(query, {"_id": 0}).sort("cargo", 1).to_list(1000)
    return [QuadroAdminResponse(**m) for m in membros]

@api_router.put("/quadro-admin/{membro_id}")
async def atualizar_quadro_admin(membro_id: str, data: QuadroAdminBase, current_user: dict = Depends(get_current_user)):
    membro = await db.quadro_admin.find_one({"id": membro_id}, {"_id": 0})
    if not membro:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if membro["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode editar membros da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.quadro_admin.update_one(
        {"id": membro_id},
        {"$set": data.model_dump()}
    )
    
    return {"message": "Membro atualizado com sucesso"}

@api_router.delete("/quadro-admin/{membro_id}")
async def remover_quadro_admin(membro_id: str, current_user: dict = Depends(get_current_user)):
    membro = await db.quadro_admin.find_one({"id": membro_id}, {"_id": 0})
    if not membro:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if membro["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode remover membros da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.quadro_admin.update_one({"id": membro_id}, {"$set": {"ativo": False}})
    return {"message": "Membro removido com sucesso"}

# ======================== DADOS DA INSTITUIÇÃO (FICHA ESCOLAR) ========================

@api_router.get("/escola/dados-instituicao")
async def get_dados_instituicao(current_user: dict = Depends(get_current_escola_user)):
    """Retorna os dados completos da instituição para o formulário"""
    escola = await db.escolas.find_one({"id": current_user["escola_id"]}, {"_id": 0})
    if not escola:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    return escola

@api_router.put("/escola/dados-instituicao")
async def atualizar_dados_instituicao(data: DadosInstituicaoBase, current_user: dict = Depends(get_current_escola_user)):
    """Atualiza os dados da instituição"""
    await check_escola_bloqueada(current_user["escola_id"])
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {**data.model_dump(exclude_none=True), "data_atualizacao": now}
    
    await db.escolas.update_one(
        {"id": current_user["escola_id"]},
        {"$set": update_data}
    )
    
    return {"message": "Dados da instituição atualizados com sucesso"}

# ======================== DEPENDÊNCIAS FÍSICAS ========================

@api_router.get("/dependencias-fisicas", response_model=List[DependenciaFisicaResponse])
async def listar_dependencias_fisicas(escola_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Lista dependências físicas da escola"""
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        query = {"escola_id": user_escola_id}
    elif escola_id:
        query = {"escola_id": escola_id}
    else:
        query = {}
    
    dependencias = await db.dependencias_fisicas.find(query, {"_id": 0}).sort("tipo", 1).to_list(1000)
    return [DependenciaFisicaResponse(**d) for d in dependencias]

@api_router.post("/dependencias-fisicas", response_model=DependenciaFisicaResponse)
async def criar_dependencia_fisica(data: DependenciaFisicaCreate, current_user: dict = Depends(get_current_user)):
    """Cria uma nova dependência física"""
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if data.escola_id != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode adicionar dependências à sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    dependencia = {
        "id": str(uuid.uuid4()),
        **data.model_dump()
    }
    
    await db.dependencias_fisicas.insert_one(dependencia)
    return DependenciaFisicaResponse(**{k: v for k, v in dependencia.items() if k != "_id"})

@api_router.put("/dependencias-fisicas/{dependencia_id}")
async def atualizar_dependencia_fisica(dependencia_id: str, data: DependenciaFisicaBase, current_user: dict = Depends(get_current_user)):
    """Atualiza uma dependência física"""
    dependencia = await db.dependencias_fisicas.find_one({"id": dependencia_id}, {"_id": 0})
    if not dependencia:
        raise HTTPException(status_code=404, detail="Dependência não encontrada")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if dependencia["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode editar dependências da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.dependencias_fisicas.update_one(
        {"id": dependencia_id},
        {"$set": data.model_dump()}
    )
    
    return {"message": "Dependência atualizada com sucesso"}

@api_router.delete("/dependencias-fisicas/{dependencia_id}")
async def remover_dependencia_fisica(dependencia_id: str, current_user: dict = Depends(get_current_user)):
    """Remove uma dependência física"""
    dependencia = await db.dependencias_fisicas.find_one({"id": dependencia_id}, {"_id": 0})
    if not dependencia:
        raise HTTPException(status_code=404, detail="Dependência não encontrada")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if dependencia["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode remover dependências da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.dependencias_fisicas.delete_one({"id": dependencia_id})
    return {"message": "Dependência removida com sucesso"}

# ======================== MOBILIÁRIO E EQUIPAMENTO ========================

@api_router.get("/mobiliario-equipamento", response_model=List[MobiliarioEquipamentoResponse])
async def listar_mobiliario_equipamento(escola_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Lista mobiliário e equipamentos da escola"""
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        query = {"escola_id": user_escola_id}
    elif escola_id:
        query = {"escola_id": escola_id}
    else:
        query = {}
    
    items = await db.mobiliario_equipamento.find(query, {"_id": 0}).sort("tipo", 1).to_list(1000)
    # Calcula o total
    result = []
    for item in items:
        item["qtd_total"] = item.get("qtd_excelente", 0) + item.get("qtd_bom", 0) + item.get("qtd_regular", 0) + item.get("qtd_pessimo", 0)
        result.append(MobiliarioEquipamentoResponse(**item))
    return result

@api_router.post("/mobiliario-equipamento", response_model=MobiliarioEquipamentoResponse)
async def criar_mobiliario_equipamento(data: MobiliarioEquipamentoCreate, current_user: dict = Depends(get_current_user)):
    """Cria um novo item de mobiliário/equipamento"""
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if data.escola_id != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode adicionar itens à sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    item_data = data.model_dump()
    item = {
        "id": str(uuid.uuid4()),
        **item_data
    }
    
    await db.mobiliario_equipamento.insert_one(item)
    
    item["qtd_total"] = item.get("qtd_excelente", 0) + item.get("qtd_bom", 0) + item.get("qtd_regular", 0) + item.get("qtd_pessimo", 0)
    return MobiliarioEquipamentoResponse(**{k: v for k, v in item.items() if k != "_id"})

@api_router.put("/mobiliario-equipamento/{item_id}")
async def atualizar_mobiliario_equipamento(item_id: str, data: MobiliarioEquipamentoBase, current_user: dict = Depends(get_current_user)):
    """Atualiza um item de mobiliário/equipamento"""
    item = await db.mobiliario_equipamento.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if item["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode editar itens da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.mobiliario_equipamento.update_one(
        {"id": item_id},
        {"$set": data.model_dump()}
    )
    
    return {"message": "Item atualizado com sucesso"}

@api_router.delete("/mobiliario-equipamento/{item_id}")
async def remover_mobiliario_equipamento(item_id: str, current_user: dict = Depends(get_current_user)):
    """Remove um item de mobiliário/equipamento"""
    item = await db.mobiliario_equipamento.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if item["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode remover itens da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.mobiliario_equipamento.delete_one({"id": item_id})
    return {"message": "Item removido com sucesso"}

# ======================== DOCENTES COMPLETOS ========================

@api_router.get("/docentes-completos", response_model=List[DocenteCompletoResponse])
async def listar_docentes_completos(escola_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Lista docentes com dados completos"""
    query = {"ativo": True}
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        query["escola_id"] = user_escola_id
    elif escola_id:
        query["escola_id"] = escola_id
    
    docentes = await db.docentes_completos.find(query, {"_id": 0}).sort("nome", 1).to_list(1000)
    return [DocenteCompletoResponse(**d) for d in docentes]

@api_router.get("/docentes-completos/{docente_id}", response_model=DocenteCompletoResponse)
async def get_docente_completo(docente_id: str, current_user: dict = Depends(get_current_user)):
    """Retorna um docente específico com dados completos"""
    docente = await db.docentes_completos.find_one({"id": docente_id, "ativo": True}, {"_id": 0})
    if not docente:
        raise HTTPException(status_code=404, detail="Docente não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola" and docente["escola_id"] != user_escola_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return DocenteCompletoResponse(**docente)

@api_router.post("/docentes-completos", response_model=DocenteCompletoResponse)
async def criar_docente_completo(data: DocenteCompletoCreate, current_user: dict = Depends(get_current_user)):
    """Cria um novo docente com dados completos"""
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if data.escola_id != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode adicionar docentes à sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    now = datetime.now(timezone.utc).isoformat()
    docente = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "data_cadastro": now,
        "ativo": True
    }
    
    await db.docentes_completos.insert_one(docente)
    return DocenteCompletoResponse(**{k: v for k, v in docente.items() if k != "_id"})

@api_router.put("/docentes-completos/{docente_id}")
async def atualizar_docente_completo(docente_id: str, data: DocenteCompletoBase, current_user: dict = Depends(get_current_user)):
    """Atualiza um docente completo"""
    docente = await db.docentes_completos.find_one({"id": docente_id}, {"_id": 0})
    if not docente:
        raise HTTPException(status_code=404, detail="Docente não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if docente["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode editar docentes da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.docentes_completos.update_one(
        {"id": docente_id},
        {"$set": data.model_dump()}
    )
    
    return {"message": "Docente atualizado com sucesso"}

@api_router.delete("/docentes-completos/{docente_id}")
async def remover_docente_completo(docente_id: str, current_user: dict = Depends(get_current_user)):
    """Remove um docente"""
    docente = await db.docentes_completos.find_one({"id": docente_id}, {"_id": 0})
    if not docente:
        raise HTTPException(status_code=404, detail="Docente não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if docente["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode remover docentes da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.docentes_completos.update_one({"id": docente_id}, {"$set": {"ativo": False}})
    return {"message": "Docente removido com sucesso"}

# ======================== DOCUMENTOS DE GESTÃO ========================

@api_router.get("/documentos-gestao/tipos")
async def listar_tipos_documentos_gestao():
    """Lista os tipos de documentos de gestão disponíveis"""
    return TIPOS_DOCUMENTOS_GESTAO

@api_router.get("/documentos-gestao", response_model=List[DocumentoResponse])
async def listar_documentos_gestao(escola_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Lista documentos de gestão da escola"""
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        query = {"escola_id": user_escola_id, "is_deleted": False}
    elif escola_id:
        query = {"escola_id": escola_id, "is_deleted": False}
    else:
        query = {"is_deleted": False}
    
    docs = await db.documentos_gestao.find(query, {"_id": 0}).sort("data_cadastro", -1).to_list(1000)
    return [DocumentoResponse(**d) for d in docs]

@api_router.post("/documentos-gestao", response_model=DocumentoResponse)
async def upload_documento_gestao(
    tipo: str = Query(..., description="Tipo do documento"),
    descricao: str = Query(None, description="Descrição adicional"),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Faz upload de um documento de gestão"""
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        await check_escola_bloqueada(user_escola_id)
    
    # Validar tipo de arquivo
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "application/msword", 
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.")
    
    # Limitar tamanho (10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo: 10MB")
    
    # Gerar ID e path
    doc_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    storage_path = generate_storage_path(user_escola_id, "documentos_gestao", doc_id, ext)
    
    # Fazer upload
    try:
        result = put_object(storage_path, content, file.content_type)
    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail="Erro ao fazer upload do arquivo")
    
    now = datetime.now(timezone.utc).isoformat()
    documento = {
        "id": doc_id,
        "escola_id": user_escola_id,
        "tipo": tipo,
        "descricao": descricao,
        "nome_arquivo": file.filename,
        "storage_path": result["path"],
        "content_type": file.content_type,
        "tamanho": result["size"],
        "data_cadastro": now,
        "is_deleted": False
    }
    
    await db.documentos_gestao.insert_one(documento)
    
    # Atualizar data de atualização da escola
    await db.escolas.update_one({"id": user_escola_id}, {"$set": {"data_atualizacao": now}})
    
    return DocumentoResponse(**{k: v for k, v in documento.items() if k != "_id"})

@api_router.get("/documentos-gestao/{doc_id}/download")
async def download_documento_gestao(
    doc_id: str,
    authorization: str = Header(None),
    auth: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Faz download de um documento de gestão"""
    doc = await db.documentos_gestao.find_one({"id": doc_id, "is_deleted": False}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    # Verificar permissão
    if current_user.get("type") == "escola" and doc["escola_id"] != user_escola_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    try:
        data, content_type = get_object(doc["storage_path"])
        return Response(
            content=data,
            media_type=doc.get("content_type", content_type),
            headers={
                "Content-Disposition": f'attachment; filename="{doc["nome_arquivo"]}"'
            }
        )
    except Exception as e:
        logger.error(f"Erro no download: {e}")
        raise HTTPException(status_code=500, detail="Erro ao baixar arquivo")

@api_router.delete("/documentos-gestao/{doc_id}")
async def excluir_documento_gestao(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Exclui (soft delete) um documento de gestão"""
    doc = await db.documentos_gestao.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if doc["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Você só pode excluir documentos da sua própria escola")
        await check_escola_bloqueada(user_escola_id)
    
    await db.documentos_gestao.update_one({"id": doc_id}, {"$set": {"is_deleted": True}})
    return {"message": "Documento excluído com sucesso"}

# ======================== DOCUMENTOS DE DOCENTES ========================

@api_router.get("/documentos-docentes/tipos")
async def listar_tipos_documentos_docente():
    """Lista os tipos de documentos de docentes disponíveis"""
    return TIPOS_DOCUMENTOS_DOCENTE

@api_router.get("/documentos-docentes/{docente_id}", response_model=List[DocumentoDocenteResponse])
async def listar_documentos_docente(docente_id: str, current_user: dict = Depends(get_current_user)):
    """Lista documentos de um docente"""
    docente = await db.docentes_completos.find_one({"id": docente_id, "ativo": True}, {"_id": 0})
    if not docente:
        raise HTTPException(status_code=404, detail="Docente não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola" and docente["escola_id"] != user_escola_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    docs = await db.documentos_docentes.find(
        {"docente_id": docente_id, "is_deleted": False}, {"_id": 0}
    ).sort("data_cadastro", -1).to_list(100)
    
    return [DocumentoDocenteResponse(**d) for d in docs]

@api_router.post("/documentos-docentes/{docente_id}", response_model=DocumentoDocenteResponse)
async def upload_documento_docente(
    docente_id: str,
    tipo: str = Query(..., description="Tipo do documento"),
    descricao: str = Query(None, description="Descrição adicional"),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Faz upload de um documento para um docente"""
    docente = await db.docentes_completos.find_one({"id": docente_id, "ativo": True}, {"_id": 0})
    if not docente:
        raise HTTPException(status_code=404, detail="Docente não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if docente["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
        await check_escola_bloqueada(user_escola_id)
    
    # Validar tipo de arquivo
    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido. Use PDF, JPG ou PNG.")
    
    # Limitar tamanho (5MB)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo: 5MB")
    
    # Gerar ID e path
    doc_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    storage_path = generate_storage_path(docente["escola_id"], f"docentes/{docente_id}", doc_id, ext)
    
    # Fazer upload
    try:
        result = put_object(storage_path, content, file.content_type)
    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail="Erro ao fazer upload do arquivo")
    
    now = datetime.now(timezone.utc).isoformat()
    documento = {
        "id": doc_id,
        "docente_id": docente_id,
        "escola_id": docente["escola_id"],
        "tipo": tipo,
        "descricao": descricao,
        "nome_arquivo": file.filename,
        "storage_path": result["path"],
        "content_type": file.content_type,
        "tamanho": result["size"],
        "data_cadastro": now,
        "is_deleted": False
    }
    
    await db.documentos_docentes.insert_one(documento)
    return DocumentoDocenteResponse(**{k: v for k, v in documento.items() if k != "_id"})

@api_router.get("/documentos-docentes/{docente_id}/{doc_id}/download")
async def download_documento_docente(
    docente_id: str,
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Faz download de um documento de docente"""
    doc = await db.documentos_docentes.find_one(
        {"id": doc_id, "docente_id": docente_id, "is_deleted": False}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola" and doc["escola_id"] != user_escola_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    try:
        data, content_type = get_object(doc["storage_path"])
        return Response(
            content=data,
            media_type=doc.get("content_type", content_type),
            headers={
                "Content-Disposition": f'attachment; filename="{doc["nome_arquivo"]}"'
            }
        )
    except Exception as e:
        logger.error(f"Erro no download: {e}")
        raise HTTPException(status_code=500, detail="Erro ao baixar arquivo")

@api_router.delete("/documentos-docentes/{docente_id}/{doc_id}")
async def excluir_documento_docente(docente_id: str, doc_id: str, current_user: dict = Depends(get_current_user)):
    """Exclui (soft delete) um documento de docente"""
    doc = await db.documentos_docentes.find_one({"id": doc_id, "docente_id": docente_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    user_escola_id = await get_escola_id_from_user(current_user)
    
    if current_user.get("type") == "escola":
        if doc["escola_id"] != user_escola_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
        await check_escola_bloqueada(user_escola_id)
    
    await db.documentos_docentes.update_one({"id": doc_id}, {"$set": {"is_deleted": True}})
    return {"message": "Documento excluído com sucesso"}

# ======================== ADMINS (COMEP) ========================

@api_router.post("/admins", response_model=AdminResponse)
async def criar_admin(data: AdminCreate, current_admin: dict = Depends(get_current_admin)):
    existing = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    now = datetime.now(timezone.utc).isoformat()
    admin = {
        "id": str(uuid.uuid4()),
        "nome": data.nome,
        "email": data.email,
        "cargo": data.cargo,
        "senha_hash": hash_password(data.senha),
        "data_cadastro": now,
        "ativo": True
    }
    
    await db.admins.insert_one(admin)
    return AdminResponse(**{k: v for k, v in admin.items() if k not in ["_id", "senha_hash"]})

@api_router.get("/admins", response_model=List[AdminResponse])
async def listar_admins(current_admin: dict = Depends(get_current_admin)):
    admins = await db.admins.find({"ativo": True}, {"_id": 0, "senha_hash": 0}).to_list(100)
    return [AdminResponse(**a) for a in admins]

# ======================== DASHBOARD ========================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_admin: dict = Depends(get_current_admin)):
    total_escolas = await db.escolas.count_documents({})
    escolas_ativas = await db.escolas.count_documents({"situacao": "ativa"})
    escolas_em_analise = await db.escolas.count_documents({"situacao": "em_analise"})
    total_docentes = await db.docentes.count_documents({"ativo": True})
    solicitacoes_pendentes = await db.solicitacoes.count_documents({"status": "pendente"})
    
    # Estimate students based on number of teachers (rough estimate: 25 students per teacher)
    total_alunos_estimado = total_docentes * 25
    
    return DashboardStats(
        total_escolas=total_escolas,
        escolas_ativas=escolas_ativas,
        escolas_em_analise=escolas_em_analise,
        total_docentes=total_docentes,
        total_alunos_estimado=total_alunos_estimado,
        solicitacoes_pendentes=solicitacoes_pendentes
    )

@api_router.get("/dashboard/escola/stats")
async def get_escola_stats(current_user: dict = Depends(get_current_escola_user)):
    escola_id = current_user["escola_id"]
    
    total_docentes = await db.docentes.count_documents({"escola_id": escola_id, "ativo": True})
    total_quadro = await db.quadro_admin.count_documents({"escola_id": escola_id, "ativo": True})
    
    return {
        "total_docentes": total_docentes,
        "total_quadro_admin": total_quadro
    }

# ======================== SEED DATA ========================

@api_router.post("/seed")
async def seed_database():
    """Create initial admin user and all 18 schools with real data"""
    
    # Check if admin already exists
    existing_admin = await db.admins.find_one({"email": "admin@comep.gov.br"}, {"_id": 0})
    if existing_admin:
        return {"message": "Database already seeded"}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create default admin
    admin = {
        "id": str(uuid.uuid4()),
        "nome": "Administrador COMEP",
        "email": "admin@comep.gov.br",
        "cargo": "Presidente",
        "senha_hash": hash_password("admin123"),
        "data_cadastro": now,
        "ativo": True
    }
    await db.admins.insert_one(admin)
    
    # Real school data from Pereiro-CE
    escolas_data = [
        {"inep": "23056797", "nome": "CEI MARIA EUNICE RODRIGUES OLIVEIRA", "diretor": "JOSE DIONES RODRIGUES FERREIRA", "cpf": "05174aborto591", "email": "josediones.rf@gmail.com", "telefone": "88996141507"},
        {"inep": "23249714", "nome": "CEI MARIA JOSÉ RODRIGUES", "diretor": "MARIA LUCIA FERREIRA DA SILVA", "cpf": "02570783373", "email": "luciaferreira1015@gmail.com", "telefone": "88997302570"},
        {"inep": "23056789", "nome": "CEI MARIA ZILDA RODRIGUES ARAUJO", "diretor": "LUZINETE MARIA DO NASCIMENTO", "cpf": "87853523300", "email": "luzinetemarianascimento@gmail.com", "telefone": "88994050562"},
        {"inep": "23249722", "nome": "CEI RAIMUNDO RIBEIRO SOBRINHO", "diretor": "MARIA ECILVÂNIA XAVIER FERREIRA", "cpf": "05078489303", "email": "ecilvaniaferreira@gmail.com", "telefone": "88999265930"},
        {"inep": "23249757", "nome": "CEI MARIA LINDALVA FERREIRA", "diretor": "MARIA LINDACI DA SILVA", "cpf": "02600897317", "email": "lindacisilva05@gmail.com", "telefone": "88994246706"},
        {"inep": "23056827", "nome": "EEIEF ANTONIO ALVES PEREIRA", "diretor": "ANTONIA IVONETE ALVES DE ARAUJO", "cpf": "53269705387", "email": "netaalvesgo@gmail.com", "telefone": "88992078795"},
        {"inep": "23249730", "nome": "EEIEF JOAQUIM JOSE DE SOUSA", "diretor": "FRANCIVANDA FERREIRA NUNES", "cpf": "90717694304", "email": "francivandaferreira2018@gmail.com", "telefone": "88999717614"},
        {"inep": "23056843", "nome": "EEIEF JOSE ALVES FERREIRA", "diretor": "ZENILDA FERREIRA DE SOUSA", "cpf": "96757949320", "email": "zenildaferreiradesousa1979@gmail.com", "telefone": "88996308580"},
        {"inep": "23056819", "nome": "EEIEF JOSE MENDES DA CRUZ", "diretor": "CICERA FERREIRA DA SILVA SOUSA", "cpf": "01270540302", "email": "cicerasilvasousa2016@gmail.com", "telefone": "88999410566"},
        {"inep": "23056851", "nome": "EEIEF MANOEL ALVES DE ARAUJO", "diretor": "MARIA FRANCINEIDE FERREIRA DA SILVA", "cpf": "01223390321", "email": "francileide.ferreira2019@gmail.com", "telefone": "88999693331"},
        {"inep": "23056770", "nome": "EEIEF MARIA RIBEIRO DA CONCEICAO", "diretor": "MARIA LINDINALVA SANTOS RODRIGUES", "cpf": "94963037320", "email": "lindinalvasanto@gmail.com", "telefone": "88999418562"},
        {"inep": "23249749", "nome": "EEIEF RAIMUNDO RODRIGUES DA SILVA", "diretor": "MARIA LUCINEIDE XAVIER DA SILVA", "cpf": "93547676372", "email": "lucimeidexavier2015@gmail.com", "telefone": "88981258827"},
        {"inep": "23056860", "nome": "EEIEF ANTONIO VIEIRA DA SILVA", "diretor": "MARIA DASDORES DE OLIVEIRA", "cpf": "01153817393", "email": "mariadasdoresoliveira85@gmail.com", "telefone": "88999024763"},
        {"inep": "23173688", "nome": "EEIEF FRANCISCO FERREIRA FILHO", "diretor": "MARIA FRANCILEIDE ALVES DE ARAÚJO", "cpf": "03216082371", "email": "franciaalvesaraujo@gmail.com", "telefone": "88999673091"},
        {"inep": "23056916", "nome": "EEIEF FRANCISCO ALVES DA SILVA", "diretor": "MARIA ECILENE XAVIER FERREIRA", "cpf": "88556556368", "email": "ecilene.xavier@gmail.com", "telefone": "88999275930"},
        {"inep": "23056835", "nome": "EEIEF JOSE FERREIRA LEITE", "diretor": "MARIA ZÉLIA FERREIRA DA SILVA", "cpf": "88556580320", "email": "zeliaferreiras@gmail.com", "telefone": "88999563423"},
        {"inep": "23056878", "nome": "EMEF CASIMIRO GONCALVES DE ARAUJO", "diretor": "RAIMUNDO NONATO ALVES DE OLIVEIRA", "cpf": "53269845315", "email": "nonatoalves1968@gmail.com", "telefone": "88994171754"},
        {"inep": "23056886", "nome": "EMEF MANOEL DE PAULA MEIRELES", "diretor": "MARIA ZENIRA FERREIRA DA SILVA", "cpf": "63773570391", "email": "mariazenirasilva33@gmail.com", "telefone": "88996308582"},
    ]
    
    for escola_data in escolas_data:
        escola_id = str(uuid.uuid4())
        
        # Clean CPF (remove any non-numeric characters)
        cpf_limpo = ''.join(filter(str.isdigit, escola_data["cpf"]))
        
        # Create escola
        escola = {
            "id": escola_id,
            "codigo_inep": escola_data["inep"],
            "nome": escola_data["nome"],
            "endereco": f"Pereiro - CE",
            "telefone": escola_data.get("telefone"),
            "email": escola_data.get("email"),
            "modalidades": [],
            "situacao": "ativa",
            "bloqueado": False,
            "motivo_bloqueio": None,
            "data_cadastro": now,
            "data_atualizacao": now
        }
        await db.escolas.insert_one(escola)
        
        # Create diretor user
        diretor_user = {
            "id": str(uuid.uuid4()),
            "escola_id": escola_id,
            "nome": escola_data["diretor"],
            "cpf": cpf_limpo,
            "email": escola_data.get("email"),
            "telefone": escola_data.get("telefone"),
            "cargo": "Diretor",
            "senha_hash": hash_password("123456"),  # Senha padrão inicial
            "ativo": True
        }
        await db.usuarios_escola.insert_one(diretor_user)
        
        # Create secretario user (fictício por enquanto)
        secretario_user = {
            "id": str(uuid.uuid4()),
            "escola_id": escola_id,
            "nome": f"Secretário(a) - {escola_data['nome'][:30]}",
            "cpf": f"00000000{escola_data['inep'][-3:]}",  # CPF fictício baseado no INEP
            "email": None,
            "telefone": None,
            "cargo": "Secretário Escolar",
            "senha_hash": hash_password("123456"),  # Senha padrão inicial
            "ativo": True
        }
        await db.usuarios_escola.insert_one(secretario_user)
    
    return {
        "message": "Database seeded with 18 schools and users",
        "admin_credentials": {
            "email": "admin@comep.gov.br",
            "senha": "admin123"
        },
        "escola_credentials": {
            "info": "Use o código INEP + CPF do diretor + senha '123456'",
            "exemplo": {
                "codigo_inep": "23056797",
                "cpf": "05174591",
                "senha": "123456"
            }
        }
    }

# ======================== BLOQUEIO/DESBLOQUEIO ========================

class BloqueioRequest(BaseModel):
    motivo: str

@api_router.put("/escolas/{escola_id}/bloquear")
async def bloquear_escola(escola_id: str, data: BloqueioRequest, current_admin: dict = Depends(get_current_admin)):
    """Block a school from editing data (for COMEP analysis)"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.escolas.update_one(
        {"id": escola_id},
        {"$set": {
            "bloqueado": True,
            "motivo_bloqueio": data.motivo,
            "data_bloqueio": now,
            "bloqueado_por": current_admin["sub"]
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    
    # Get escola email to notify
    escola = await db.escolas.find_one({"id": escola_id}, {"_id": 0})
    if escola and escola.get("email"):
        html_content = get_email_template(
            "Painel Temporariamente Bloqueado",
            f"""
            <p>Prezado(a) Gestor(a) da <strong>{escola['nome']}</strong>,</p>
            <p>Informamos que o painel da sua escola foi <strong>bloqueado temporariamente</strong> para análise de documentos pelo COMEP.</p>
            <p><strong>Motivo:</strong> {data.motivo}</p>
            <p>Durante este período, não será possível realizar edições nos dados cadastrados.</p>
            <p>Você será notificado assim que a análise for concluída e o painel for liberado.</p>
            <p>Em caso de dúvidas, entre em contato conosco.</p>
            """
        )
        await send_email(escola["email"], "COMEP - Painel Bloqueado para Análise", html_content)
    
    return {"message": "Escola bloqueada com sucesso"}

@api_router.put("/escolas/{escola_id}/desbloquear")
async def desbloquear_escola(escola_id: str, parecer: Optional[str] = None, current_admin: dict = Depends(get_current_admin)):
    """Unblock a school after COMEP analysis"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.escolas.update_one(
        {"id": escola_id},
        {"$set": {
            "bloqueado": False,
            "motivo_bloqueio": None,
            "data_desbloqueio": now,
            "parecer_liberacao": parecer
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    
    # Get escola email to notify
    escola = await db.escolas.find_one({"id": escola_id}, {"_id": 0})
    if escola and escola.get("email"):
        parecer_text = f"<p><strong>Parecer:</strong> {parecer}</p>" if parecer else ""
        html_content = get_email_template(
            "Painel Liberado!",
            f"""
            <p>Prezado(a) Gestor(a) da <strong>{escola['nome']}</strong>,</p>
            <p>Informamos que a análise foi concluída e o painel da sua escola foi <strong>liberado</strong>!</p>
            {parecer_text}
            <p>Você já pode acessar o sistema e realizar as atualizações necessárias.</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="https://pereiro-escolas.preview.emergentagent.com" style="background-color: #0F766E; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Acessar Sistema
                </a>
            </p>
            """
        )
        await send_email(escola["email"], "COMEP - Painel Liberado!", html_content)
    
    return {"message": "Escola desbloqueada com sucesso"}

# ======================== USUARIOS ESCOLA (Admin) ========================

@api_router.get("/escolas/{escola_id}/usuarios", response_model=List[UsuarioEscolaResponse])
async def listar_usuarios_escola(escola_id: str, current_admin: dict = Depends(get_current_admin)):
    """List all users of a school (admin only)"""
    usuarios = await db.usuarios_escola.find(
        {"escola_id": escola_id, "ativo": True}, 
        {"_id": 0, "senha_hash": 0}
    ).to_list(100)
    return [UsuarioEscolaResponse(**u) for u in usuarios]

@api_router.post("/escolas/{escola_id}/usuarios", response_model=UsuarioEscolaResponse)
async def criar_usuario_escola(escola_id: str, data: UsuarioEscolaCreate, current_admin: dict = Depends(get_current_admin)):
    """Create a new user for a school (admin only)"""
    # Check if escola exists
    escola = await db.escolas.find_one({"id": escola_id}, {"_id": 0})
    if not escola:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    
    # Check if CPF already exists for this school
    existing = await db.usuarios_escola.find_one({
        "escola_id": escola_id,
        "cpf": data.cpf.replace(".", "").replace("-", "")
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="CPF já cadastrado para esta escola")
    
    usuario = {
        "id": str(uuid.uuid4()),
        "escola_id": escola_id,
        "nome": data.nome,
        "cpf": data.cpf.replace(".", "").replace("-", ""),
        "email": data.email,
        "telefone": data.telefone,
        "cargo": data.cargo,
        "senha_hash": hash_password(data.senha),
        "ativo": True
    }
    
    await db.usuarios_escola.insert_one(usuario)
    return UsuarioEscolaResponse(**{k: v for k, v in usuario.items() if k not in ["_id", "senha_hash"]})

# ======================== HEALTH CHECK ========================

@api_router.get("/")
async def root():
    return {"message": "COMEP API - Conselho Municipal de Educação de Pereiro"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ======================== REPORTS (PDF) ========================

@api_router.get("/relatorios/escola/{escola_id}/pdf")
async def download_escola_report(escola_id: str, current_user: dict = Depends(get_current_user)):
    """Generate PDF report for a specific school"""
    # Check permissions
    if current_user.get("type") == "escola" and current_user["sub"] != escola_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    escola = await db.escolas.find_one({"id": escola_id}, {"_id": 0, "senha_hash": 0})
    if not escola:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    
    docentes = await db.docentes.find({"escola_id": escola_id, "ativo": True}, {"_id": 0}).to_list(1000)
    quadro_admin = await db.quadro_admin.find({"escola_id": escola_id, "ativo": True}, {"_id": 0}).to_list(100)
    
    pdf_bytes = generate_escola_report_pdf(escola, docentes, quadro_admin)
    
    filename = f"relatorio_escola_{escola['codigo_inep']}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/relatorios/escolas/pdf")
async def download_escolas_summary_report(current_admin: dict = Depends(get_current_admin)):
    """Generate PDF summary report of all schools"""
    escolas = await db.escolas.find({}, {"_id": 0, "senha_hash": 0}).sort("nome", 1).to_list(1000)
    
    # Get stats
    total_escolas = len(escolas)
    escolas_ativas = len([e for e in escolas if e.get("situacao") == "ativa"])
    escolas_em_analise = len([e for e in escolas if e.get("situacao") == "em_analise"])
    total_docentes = await db.docentes.count_documents({"ativo": True})
    solicitacoes_pendentes = await db.solicitacoes.count_documents({"status": "pendente"})
    
    stats = {
        "total_escolas": total_escolas,
        "escolas_ativas": escolas_ativas,
        "escolas_em_analise": escolas_em_analise,
        "total_docentes": total_docentes,
        "total_alunos_estimado": total_docentes * 25,
        "solicitacoes_pendentes": solicitacoes_pendentes
    }
    
    pdf_bytes = generate_escolas_summary_pdf(escolas, stats)
    
    filename = f"relatorio_geral_escolas_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ======================== NOTIFICATIONS ========================

@api_router.get("/notificacoes/escolas-desatualizadas")
async def get_escolas_desatualizadas(current_admin: dict = Depends(get_current_admin)):
    """Get list of schools with outdated data (more than 90 days without update)"""
    limite = datetime.now(timezone.utc) - timedelta(days=90)
    
    escolas = await db.escolas.find({"situacao": "ativa"}, {"_id": 0, "senha_hash": 0}).to_list(1000)
    
    desatualizadas = []
    for escola in escolas:
        data_atualizacao = escola.get("data_atualizacao")
        if data_atualizacao:
            try:
                dt = datetime.fromisoformat(data_atualizacao.replace('Z', '+00:00'))
                dias_sem_atualizar = (datetime.now(timezone.utc) - dt).days
                if dias_sem_atualizar >= 90:
                    desatualizadas.append({
                        "id": escola["id"],
                        "nome": escola["nome"],
                        "codigo_inep": escola.get("codigo_inep", "-"),
                        "email": escola.get("email"),
                        "dias_sem_atualizar": dias_sem_atualizar,
                        "data_atualizacao": data_atualizacao
                    })
            except:
                pass
    
    # Sort by days without update (descending)
    desatualizadas.sort(key=lambda x: x["dias_sem_atualizar"], reverse=True)
    
    return {
        "total": len(desatualizadas),
        "escolas": desatualizadas
    }

@api_router.post("/notificacoes/enviar-lembretes")
async def enviar_lembretes_atualizacao(current_admin: dict = Depends(get_current_admin)):
    """Send update reminder emails to schools with outdated data"""
    limite = datetime.now(timezone.utc) - timedelta(days=90)
    
    escolas = await db.escolas.find({"situacao": "ativa"}, {"_id": 0, "senha_hash": 0}).to_list(1000)
    
    enviados = []
    erros = []
    
    for escola in escolas:
        data_atualizacao = escola.get("data_atualizacao")
        if data_atualizacao and escola.get("email"):
            try:
                dt = datetime.fromisoformat(data_atualizacao.replace('Z', '+00:00'))
                dias_sem_atualizar = (datetime.now(timezone.utc) - dt).days
                
                if dias_sem_atualizar >= 90:
                    html_content = get_update_reminder_email(escola["nome"], dias_sem_atualizar)
                    result = await send_email(
                        escola["email"],
                        "COMEP - Lembrete de Atualização de Dados",
                        html_content
                    )
                    
                    if result.get("status") == "success":
                        enviados.append({
                            "escola": escola["nome"],
                            "email": escola["email"],
                            "dias": dias_sem_atualizar
                        })
                        
                        # Log notification
                        await db.notificacoes.insert_one({
                            "id": str(uuid.uuid4()),
                            "tipo": "lembrete_atualizacao",
                            "escola_id": escola["id"],
                            "escola_nome": escola["nome"],
                            "email": escola["email"],
                            "dias_sem_atualizar": dias_sem_atualizar,
                            "data_envio": datetime.now(timezone.utc).isoformat(),
                            "status": "enviado"
                        })
                    else:
                        erros.append({
                            "escola": escola["nome"],
                            "erro": result.get("message", "Erro desconhecido")
                        })
            except Exception as e:
                erros.append({
                    "escola": escola["nome"],
                    "erro": str(e)
                })
    
    return {
        "enviados": len(enviados),
        "erros": len(erros),
        "detalhes_enviados": enviados,
        "detalhes_erros": erros
    }

@api_router.get("/notificacoes/historico")
async def get_historico_notificacoes(current_admin: dict = Depends(get_current_admin)):
    """Get notification history"""
    notificacoes = await db.notificacoes.find({}, {"_id": 0}).sort("data_envio", -1).to_list(100)
    return notificacoes

# ======================== DASHBOARD EVOLUTION ========================

@api_router.get("/dashboard/evolucao")
async def get_dashboard_evolucao(current_admin: dict = Depends(get_current_admin)):
    """Get evolution data for charts"""
    # Get monthly stats for the last 6 months
    now = datetime.now(timezone.utc)
    meses = []
    
    for i in range(5, -1, -1):
        mes_ref = now - timedelta(days=30*i)
        mes_nome = mes_ref.strftime("%b/%y")
        mes_inicio = mes_ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if i > 0:
            mes_fim = (mes_inicio + timedelta(days=32)).replace(day=1)
        else:
            mes_fim = now
        
        # Count escolas registered up to that month
        escolas_count = await db.escolas.count_documents({
            "data_cadastro": {"$lte": mes_fim.isoformat()}
        })
        
        # Count docentes
        docentes_count = await db.docentes.count_documents({
            "data_cadastro": {"$lte": mes_fim.isoformat()},
            "ativo": True
        })
        
        meses.append({
            "mes": mes_nome,
            "escolas": escolas_count,
            "docentes": docentes_count
        })
    
    # Get distribution by modalidade
    escolas = await db.escolas.find({"situacao": "ativa"}, {"_id": 0, "modalidades": 1}).to_list(1000)
    modalidades_count = {}
    for escola in escolas:
        for mod in escola.get("modalidades", []):
            modalidades_count[mod] = modalidades_count.get(mod, 0) + 1
    
    modalidades = [{"name": k, "value": v} for k, v in modalidades_count.items()]
    
    # Get distribution by vinculo docente
    docentes = await db.docentes.find({"ativo": True}, {"_id": 0, "vinculo": 1}).to_list(1000)
    vinculo_count = {}
    for doc in docentes:
        vinculo = doc.get("vinculo", "Outros")
        vinculo_count[vinculo] = vinculo_count.get(vinculo, 0) + 1
    
    vinculos = [{"name": k, "value": v} for k, v in vinculo_count.items()]
    
    return {
        "evolucao_mensal": meses,
        "distribuicao_modalidades": modalidades,
        "distribuicao_vinculos": vinculos
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicialização do storage no startup
@app.on_event("startup")
async def startup_event():
    try:
        init_storage()
        logger.info("Storage inicializado com sucesso")
    except Exception as e:
        logger.warning(f"Falha ao inicializar storage: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
