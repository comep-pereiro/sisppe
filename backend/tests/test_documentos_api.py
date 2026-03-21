"""
SISPPe Document Management API Tests
Tests for documentos-gestao and documentos-docentes endpoints
"""
import pytest
import requests
import os
import tempfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pereiro-escolas.preview.emergentagent.com').rstrip('/')

# Test credentials
ESCOLA_INEP = "23056797"
ESCOLA_CPF = "05174591"
ESCOLA_SENHA = "123456"


class TestDocumentosGestao:
    """Document management tests for escola"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get escola token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/escola/login", json={
            "codigo_inep": ESCOLA_INEP,
            "cpf": ESCOLA_CPF,
            "senha": ESCOLA_SENHA
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            self.escola_id = response.json()["user_data"]["escola_id"]
        else:
            pytest.skip("Escola authentication failed")
    
    def test_get_tipos_documentos_gestao(self):
        """Test getting document types list"""
        response = requests.get(f"{BASE_URL}/api/documentos-gestao/tipos", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "REGIMENTO ESCOLAR" in data
        assert "PROJETO POLÍTICO PEDAGÓGICO (PPP)" in data
        print(f"✓ Got {len(data)} document types")
    
    def test_list_documentos_gestao(self):
        """Test listing management documents"""
        response = requests.get(f"{BASE_URL}/api/documentos-gestao", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} management documents")
    
    def test_upload_documento_gestao(self):
        """Test uploading a management document"""
        # Create a test PDF file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b"%PDF-1.4 Test Document for SISPPe")
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test_upload.pdf', f, 'application/pdf')}
                params = {'tipo': 'CALENDÁRIO ESCOLAR', 'descricao': 'Teste de upload'}
                response = requests.post(
                    f"{BASE_URL}/api/documentos-gestao",
                    headers=self.headers,
                    files=files,
                    params=params
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert data["tipo"] == "CALENDÁRIO ESCOLAR"
            assert data["nome_arquivo"] == "test_upload.pdf"
            assert data["escola_id"] == self.escola_id
            print(f"✓ Uploaded document: {data['id']}")
            
            # Store for cleanup
            self.uploaded_doc_id = data["id"]
            
            # Cleanup - delete the document
            delete_response = requests.delete(
                f"{BASE_URL}/api/documentos-gestao/{data['id']}",
                headers=self.headers
            )
            assert delete_response.status_code == 200
            print(f"✓ Cleaned up test document")
            
        finally:
            os.unlink(temp_path)
    
    def test_upload_invalid_file_type(self):
        """Test uploading invalid file type is rejected"""
        with tempfile.NamedTemporaryFile(suffix='.exe', delete=False) as f:
            f.write(b"MZ fake executable")
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test.exe', f, 'application/x-msdownload')}
                params = {'tipo': 'OUTROS'}
                response = requests.post(
                    f"{BASE_URL}/api/documentos-gestao",
                    headers=self.headers,
                    files=files,
                    params=params
                )
            
            assert response.status_code == 400
            print("✓ Invalid file type rejected correctly")
            
        finally:
            os.unlink(temp_path)
    
    def test_download_documento_gestao(self):
        """Test downloading a management document"""
        # First upload a document
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b"%PDF-1.4 Test Download Document")
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test_download.pdf', f, 'application/pdf')}
                params = {'tipo': 'PLANO DE GESTÃO'}
                upload_response = requests.post(
                    f"{BASE_URL}/api/documentos-gestao",
                    headers=self.headers,
                    files=files,
                    params=params
                )
            
            assert upload_response.status_code == 200
            doc_id = upload_response.json()["id"]
            
            # Download the document
            download_response = requests.get(
                f"{BASE_URL}/api/documentos-gestao/{doc_id}/download",
                headers=self.headers
            )
            
            assert download_response.status_code == 200
            assert len(download_response.content) > 0
            print(f"✓ Downloaded document: {len(download_response.content)} bytes")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/documentos-gestao/{doc_id}", headers=self.headers)
            
        finally:
            os.unlink(temp_path)
    
    def test_delete_documento_gestao(self):
        """Test deleting a management document"""
        # First upload a document
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b"%PDF-1.4 Test Delete Document")
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test_delete.pdf', f, 'application/pdf')}
                params = {'tipo': 'OUTROS'}
                upload_response = requests.post(
                    f"{BASE_URL}/api/documentos-gestao",
                    headers=self.headers,
                    files=files,
                    params=params
                )
            
            assert upload_response.status_code == 200
            doc_id = upload_response.json()["id"]
            
            # Delete the document
            delete_response = requests.delete(
                f"{BASE_URL}/api/documentos-gestao/{doc_id}",
                headers=self.headers
            )
            
            assert delete_response.status_code == 200
            data = delete_response.json()
            assert "message" in data
            print(f"✓ Deleted document successfully")
            
            # Verify it's deleted (soft delete - should not appear in list)
            list_response = requests.get(f"{BASE_URL}/api/documentos-gestao", headers=self.headers)
            docs = list_response.json()
            doc_ids = [d["id"] for d in docs]
            assert doc_id not in doc_ids
            print(f"✓ Verified document is no longer in list")
            
        finally:
            os.unlink(temp_path)


class TestDocumentosDocentes:
    """Document management tests for docentes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get escola token and docente for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/escola/login", json={
            "codigo_inep": ESCOLA_INEP,
            "cpf": ESCOLA_CPF,
            "senha": ESCOLA_SENHA
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            self.escola_id = response.json()["user_data"]["escola_id"]
            
            # Get or create a docente for testing
            docentes_response = requests.get(
                f"{BASE_URL}/api/docentes-completos",
                headers=self.headers
            )
            if docentes_response.status_code == 200 and len(docentes_response.json()) > 0:
                self.docente_id = docentes_response.json()[0]["id"]
            else:
                # Create a test docente
                create_response = requests.post(
                    f"{BASE_URL}/api/docentes-completos",
                    headers=self.headers,
                    json={
                        "nome": "TEST_Docente Para Documentos",
                        "cpf": "99988877766",
                        "escola_id": self.escola_id,
                        "vinculo": "EFETIVO",
                        "funcao": "PROFESSOR"
                    }
                )
                if create_response.status_code == 200:
                    self.docente_id = create_response.json()["id"]
                else:
                    pytest.skip("Could not create test docente")
        else:
            pytest.skip("Escola authentication failed")
    
    def test_get_tipos_documentos_docente(self):
        """Test getting docente document types list"""
        response = requests.get(f"{BASE_URL}/api/documentos-docentes/tipos", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "DIPLOMA DE GRADUAÇÃO" in data
        assert "CERTIFICADO DE CURSO" in data
        print(f"✓ Got {len(data)} docente document types")
    
    def test_list_documentos_docente(self):
        """Test listing docente documents"""
        response = requests.get(
            f"{BASE_URL}/api/documentos-docentes/{self.docente_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} docente documents")
    
    def test_upload_documento_docente(self):
        """Test uploading a docente document"""
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b"%PDF-1.4 Test Diploma Document")
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('diploma_teste.pdf', f, 'application/pdf')}
                params = {'tipo': 'DIPLOMA DE GRADUAÇÃO', 'descricao': 'Diploma de teste'}
                response = requests.post(
                    f"{BASE_URL}/api/documentos-docentes/{self.docente_id}",
                    headers=self.headers,
                    files=files,
                    params=params
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert data["tipo"] == "DIPLOMA DE GRADUAÇÃO"
            assert data["docente_id"] == self.docente_id
            print(f"✓ Uploaded docente document: {data['id']}")
            
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/documentos-docentes/{self.docente_id}/{data['id']}",
                headers=self.headers
            )
            
        finally:
            os.unlink(temp_path)
    
    def test_download_documento_docente(self):
        """Test downloading a docente document"""
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b"%PDF-1.4 Test Download Diploma")
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('diploma_download.pdf', f, 'application/pdf')}
                params = {'tipo': 'CERTIFICADO DE CURSO'}
                upload_response = requests.post(
                    f"{BASE_URL}/api/documentos-docentes/{self.docente_id}",
                    headers=self.headers,
                    files=files,
                    params=params
                )
            
            assert upload_response.status_code == 200
            doc_id = upload_response.json()["id"]
            
            # Download
            download_response = requests.get(
                f"{BASE_URL}/api/documentos-docentes/{self.docente_id}/{doc_id}/download",
                headers=self.headers
            )
            
            assert download_response.status_code == 200
            assert len(download_response.content) > 0
            print(f"✓ Downloaded docente document: {len(download_response.content)} bytes")
            
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/documentos-docentes/{self.docente_id}/{doc_id}",
                headers=self.headers
            )
            
        finally:
            os.unlink(temp_path)
    
    def test_delete_documento_docente(self):
        """Test deleting a docente document"""
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b"%PDF-1.4 Test Delete Diploma")
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('diploma_delete.pdf', f, 'application/pdf')}
                params = {'tipo': 'DECLARAÇÃO'}
                upload_response = requests.post(
                    f"{BASE_URL}/api/documentos-docentes/{self.docente_id}",
                    headers=self.headers,
                    files=files,
                    params=params
                )
            
            assert upload_response.status_code == 200
            doc_id = upload_response.json()["id"]
            
            # Delete
            delete_response = requests.delete(
                f"{BASE_URL}/api/documentos-docentes/{self.docente_id}/{doc_id}",
                headers=self.headers
            )
            
            assert delete_response.status_code == 200
            print(f"✓ Deleted docente document successfully")
            
        finally:
            os.unlink(temp_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
