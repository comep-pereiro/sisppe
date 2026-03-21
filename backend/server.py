from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

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

app = FastAPI(title="COMEP - Conselho Municipal de Educação de Pereiro")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ======================== MODELS ========================

class EscolaBase(BaseModel):
    codigo_censo: str
    nome: str
    endereco: str
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    modalidades: List[str] = []  # Infantil, Fundamental, EJA, etc.
    situacao: str = "ativa"  # ativa, inativa, em_analise

class EscolaCreate(EscolaBase):
    cpf_responsavel: str
    senha: str

class EscolaResponse(EscolaBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    cpf_responsavel: str
    data_cadastro: str
    data_atualizacao: str

class EscolaLogin(BaseModel):
    codigo_censo: str
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

class DashboardStats(BaseModel):
    total_escolas: int
    escolas_ativas: int
    escolas_em_analise: int
    total_docentes: int
    total_alunos_estimado: int
    solicitacoes_pendentes: int

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
    escola = await db.escolas.find_one({
        "codigo_censo": data.codigo_censo,
        "cpf_responsavel": data.cpf
    }, {"_id": 0})
    
    if not escola or not verify_password(data.senha, escola.get("senha_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if escola.get("situacao") != "ativa":
        raise HTTPException(status_code=403, detail="Escola não está ativa no sistema")
    
    token = create_token(escola["id"], "escola")
    escola_data = {k: v for k, v in escola.items() if k != "senha_hash"}
    
    return TokenResponse(
        access_token=token,
        user_type="escola",
        user_data=escola_data
    )

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
    # In production, this would send an email
    if data.tipo == "escola":
        user = await db.escolas.find_one({"email": data.email}, {"_id": 0})
    else:
        user = await db.admins.find_one({"email": data.email}, {"_id": 0})
    
    if not user:
        # Don't reveal if email exists
        return {"message": "Se o email estiver cadastrado, você receberá instruções para recuperação de senha"}
    
    # In production: generate token, save to DB, send email
    return {"message": "Se o email estiver cadastrado, você receberá instruções para recuperação de senha"}

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
    
    return {"message": "Solicitação rejeitada"}

# ======================== ESCOLAS ========================

@api_router.get("/escolas", response_model=List[EscolaResponse])
async def listar_escolas(situacao: Optional[str] = None, current_admin: dict = Depends(get_current_admin)):
    query = {}
    if situacao:
        query["situacao"] = situacao
    
    escolas = await db.escolas.find(query, {"_id": 0, "senha_hash": 0}).sort("nome", 1).to_list(1000)
    return [EscolaResponse(**e) for e in escolas]

@api_router.get("/escolas/me", response_model=EscolaResponse)
async def get_minha_escola(current_escola: dict = Depends(get_current_escola)):
    escola = await db.escolas.find_one({"id": current_escola["sub"]}, {"_id": 0, "senha_hash": 0})
    if not escola:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    return EscolaResponse(**escola)

@api_router.put("/escolas/me")
async def atualizar_minha_escola(data: EscolaBase, current_escola: dict = Depends(get_current_escola)):
    now = datetime.now(timezone.utc).isoformat()
    
    await db.escolas.update_one(
        {"id": current_escola["sub"]},
        {"$set": {**data.model_dump(), "data_atualizacao": now}}
    )
    
    return {"message": "Dados atualizados com sucesso"}

@api_router.get("/escolas/{escola_id}", response_model=EscolaResponse)
async def get_escola(escola_id: str, current_admin: dict = Depends(get_current_admin)):
    escola = await db.escolas.find_one({"id": escola_id}, {"_id": 0, "senha_hash": 0})
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

@api_router.post("/docentes", response_model=DocenteResponse)
async def criar_docente(data: DocenteCreate, current_user: dict = Depends(get_current_user)):
    # Escola can only add to their own, admin can add to any
    if current_user.get("type") == "escola" and data.escola_id != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Você só pode adicionar docentes à sua própria escola")
    
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
    
    if current_user.get("type") == "escola":
        query["escola_id"] = current_user["sub"]
    elif escola_id:
        query["escola_id"] = escola_id
    
    docentes = await db.docentes.find(query, {"_id": 0}).sort("nome", 1).to_list(1000)
    return [DocenteResponse(**d) for d in docentes]

@api_router.put("/docentes/{docente_id}")
async def atualizar_docente(docente_id: str, data: DocenteBase, current_user: dict = Depends(get_current_user)):
    docente = await db.docentes.find_one({"id": docente_id}, {"_id": 0})
    if not docente:
        raise HTTPException(status_code=404, detail="Docente não encontrado")
    
    if current_user.get("type") == "escola" and docente["escola_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Você só pode editar docentes da sua própria escola")
    
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
    
    if current_user.get("type") == "escola" and docente["escola_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Você só pode remover docentes da sua própria escola")
    
    await db.docentes.update_one({"id": docente_id}, {"$set": {"ativo": False}})
    return {"message": "Docente removido com sucesso"}

# ======================== QUADRO ADMINISTRATIVO ========================

@api_router.post("/quadro-admin", response_model=QuadroAdminResponse)
async def criar_quadro_admin(data: QuadroAdminCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("type") == "escola" and data.escola_id != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Você só pode adicionar membros à sua própria escola")
    
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
    
    if current_user.get("type") == "escola":
        query["escola_id"] = current_user["sub"]
    elif escola_id:
        query["escola_id"] = escola_id
    
    membros = await db.quadro_admin.find(query, {"_id": 0}).sort("cargo", 1).to_list(1000)
    return [QuadroAdminResponse(**m) for m in membros]

@api_router.put("/quadro-admin/{membro_id}")
async def atualizar_quadro_admin(membro_id: str, data: QuadroAdminBase, current_user: dict = Depends(get_current_user)):
    membro = await db.quadro_admin.find_one({"id": membro_id}, {"_id": 0})
    if not membro:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    if current_user.get("type") == "escola" and membro["escola_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Você só pode editar membros da sua própria escola")
    
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
    
    if current_user.get("type") == "escola" and membro["escola_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Você só pode remover membros da sua própria escola")
    
    await db.quadro_admin.update_one({"id": membro_id}, {"$set": {"ativo": False}})
    return {"message": "Membro removido com sucesso"}

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
async def get_escola_stats(current_escola: dict = Depends(get_current_escola)):
    escola_id = current_escola["sub"]
    
    total_docentes = await db.docentes.count_documents({"escola_id": escola_id, "ativo": True})
    total_quadro = await db.quadro_admin.count_documents({"escola_id": escola_id, "ativo": True})
    
    return {
        "total_docentes": total_docentes,
        "total_quadro_admin": total_quadro
    }

# ======================== SEED DATA ========================

@api_router.post("/seed")
async def seed_database():
    """Create initial admin user and sample data for testing"""
    
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
    
    # Create sample escola
    escola_id = str(uuid.uuid4())
    escola = {
        "id": escola_id,
        "codigo_censo": "23456789",
        "nome": "Escola Municipal José de Alencar",
        "endereco": "Rua Principal, 123, Centro, Pereiro-CE",
        "telefone": "(88) 99999-1234",
        "email": "josealencar@escola.edu.br",
        "cpf_responsavel": "12345678900",
        "senha_hash": hash_password("escola123"),
        "modalidades": ["Educação Infantil", "Ensino Fundamental"],
        "situacao": "ativa",
        "data_cadastro": now,
        "data_atualizacao": now
    }
    await db.escolas.insert_one(escola)
    
    # Create sample docentes
    docentes = [
        {
            "id": str(uuid.uuid4()),
            "escola_id": escola_id,
            "nome": "Maria Silva Santos",
            "cpf": "11122233344",
            "email": "maria.silva@escola.edu.br",
            "telefone": "(88) 99999-1111",
            "formacao": "Especialização",
            "disciplinas": ["Português", "Literatura"],
            "carga_horaria": 40,
            "vinculo": "Efetivo",
            "data_cadastro": now,
            "ativo": True
        },
        {
            "id": str(uuid.uuid4()),
            "escola_id": escola_id,
            "nome": "João Pereira Lima",
            "cpf": "22233344455",
            "email": "joao.lima@escola.edu.br",
            "telefone": "(88) 99999-2222",
            "formacao": "Mestrado",
            "disciplinas": ["Matemática", "Física"],
            "carga_horaria": 40,
            "vinculo": "Efetivo",
            "data_cadastro": now,
            "ativo": True
        }
    ]
    await db.docentes.insert_many(docentes)
    
    # Create sample quadro administrativo
    quadro = [
        {
            "id": str(uuid.uuid4()),
            "escola_id": escola_id,
            "nome": "Ana Clara Oliveira",
            "cpf": "33344455566",
            "cargo": "Diretor",
            "email": "ana.oliveira@escola.edu.br",
            "telefone": "(88) 99999-3333",
            "formacao": "Mestrado em Gestão Educacional",
            "data_cadastro": now,
            "ativo": True
        },
        {
            "id": str(uuid.uuid4()),
            "escola_id": escola_id,
            "nome": "Carlos Eduardo Souza",
            "cpf": "44455566677",
            "cargo": "Secretário",
            "email": "carlos.souza@escola.edu.br",
            "telefone": "(88) 99999-4444",
            "formacao": "Graduação em Pedagogia",
            "data_cadastro": now,
            "ativo": True
        }
    ]
    await db.quadro_admin.insert_many(quadro)
    
    return {
        "message": "Database seeded successfully",
        "admin_credentials": {
            "email": "admin@comep.gov.br",
            "senha": "admin123"
        },
        "escola_credentials": {
            "codigo_censo": "23456789",
            "cpf": "12345678900",
            "senha": "escola123"
        }
    }

# ======================== HEALTH CHECK ========================

@api_router.get("/")
async def root():
    return {"message": "COMEP API - Conselho Municipal de Educação de Pereiro"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
