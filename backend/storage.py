"""
Módulo de armazenamento de arquivos usando Emergent Object Storage
"""
import os
import requests
import logging
from typing import Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv(Path(__file__).parent / '.env')

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "sisppe"  # Sistema de Informatização e Simplificação de Processos de Pereiro

# Storage key global - inicializado uma vez
_storage_key: Optional[str] = None

# Content types comuns
MIME_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg", 
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "txt": "text/plain",
    "csv": "text/csv"
}

def get_mime_type(filename: str) -> str:
    """Retorna o MIME type baseado na extensão do arquivo"""
    ext = filename.split(".")[-1].lower() if "." in filename else "bin"
    return MIME_TYPES.get(ext, "application/octet-stream")

def init_storage() -> str:
    """Inicializa o storage e retorna a storage_key. Chama apenas uma vez."""
    global _storage_key
    
    if _storage_key:
        return _storage_key
    
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        raise ValueError("EMERGENT_LLM_KEY não configurada")
    
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": emergent_key},
            timeout=30
        )
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        logger.info("Storage inicializado com sucesso")
        return _storage_key
    except Exception as e:
        logger.error(f"Erro ao inicializar storage: {e}")
        raise

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """
    Faz upload de um arquivo.
    
    Args:
        path: Caminho no storage (sem / no início)
        data: Bytes do arquivo
        content_type: MIME type do arquivo
        
    Returns:
        Dict com path, size, etag
    """
    key = init_storage()
    
    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={
                "X-Storage-Key": key,
                "Content-Type": content_type
            },
            data=data,
            timeout=120
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Erro ao fazer upload: {e}")
        raise

def get_object(path: str) -> Tuple[bytes, str]:
    """
    Faz download de um arquivo.
    
    Args:
        path: Caminho no storage
        
    Returns:
        Tuple (bytes do arquivo, content_type)
    """
    key = init_storage()
    
    try:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60
        )
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    except Exception as e:
        logger.error(f"Erro ao fazer download: {e}")
        raise

def generate_storage_path(escola_id: str, categoria: str, file_id: str, extension: str) -> str:
    """
    Gera um caminho padronizado para o arquivo.
    
    Formato: sisppe/escola_{escola_id}/{categoria}/{file_id}.{ext}
    """
    return f"{APP_NAME}/escola_{escola_id}/{categoria}/{file_id}.{extension}"
