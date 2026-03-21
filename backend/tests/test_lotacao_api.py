"""
Test Lotação (Teacher Assignment) API - New fields for classroom assignment
Tests for docentes-completos with new lotação fields: ano_serie, turma, turno
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pereiro-escolas.preview.emergentagent.com').rstrip('/')

# Test credentials
ESCOLA_INEP = "23056797"
ESCOLA_CPF = "05174591"
ESCOLA_SENHA = "123456"


class TestDocentesCompletosLotacao:
    """Tests for docentes-completos API with new lotação fields"""
    
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
    
    def test_create_docente_with_lotacao(self):
        """Test creating a docente with full lotação data"""
        docente_data = {
            "nome": "TEST_Professor Lotação Completa",
            "cpf": "12345678901",
            "email": "test.lotacao@escola.com",
            "telefone": "88999999999",
            "vinculo": "EFETIVO",
            "funcao": "PROFESSOR",
            "carga_horaria_semanal": 40,
            "escola_id": self.escola_id,
            "formacoes": [
                {
                    "tipo": "GRADUAÇÃO",
                    "curso": "Pedagogia",
                    "instituicao": "UECE",
                    "ano_conclusao": 2015
                }
            ],
            "atribuicoes": [
                {
                    "etapa": "ENSINO FUNDAMENTAL - ANOS INICIAIS",
                    "ano_serie": "3º ANO",
                    "turma": "A",
                    "turno": "MANHÃ",
                    "disciplina": "POLIVALENTE",
                    "dias_semana": ["SEG", "TER", "QUA", "QUI", "SEX"],
                    "carga_horaria": 20,
                    "habilitacao": "HABILITADO"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/docentes-completos",
            headers=self.headers,
            json=docente_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify basic data
        assert data["nome"] == docente_data["nome"]
        assert data["cpf"] == docente_data["cpf"]
        assert "id" in data
        
        # Verify lotação data
        assert len(data["atribuicoes"]) == 1
        atribuicao = data["atribuicoes"][0]
        assert atribuicao["etapa"] == "ENSINO FUNDAMENTAL - ANOS INICIAIS"
        assert atribuicao["ano_serie"] == "3º ANO"
        assert atribuicao["turma"] == "A"
        assert atribuicao["turno"] == "MANHÃ"
        assert atribuicao["disciplina"] == "POLIVALENTE"
        assert atribuicao["carga_horaria"] == 20
        
        print(f"✓ Created docente with lotação: {data['nome']}")
        print(f"  - Lotação: {atribuicao['etapa']} / {atribuicao['ano_serie']} / Turma {atribuicao['turma']} / {atribuicao['turno']}")
        
        # Store ID for cleanup
        self.created_docente_id = data["id"]
        return data["id"]
    
    def test_create_docente_educacao_infantil(self):
        """Test creating a docente with Educação Infantil lotação"""
        docente_data = {
            "nome": "TEST_Professor Educação Infantil",
            "cpf": "98765432100",
            "vinculo": "CONTRATADO",
            "funcao": "PROFESSOR",
            "carga_horaria_semanal": 40,
            "escola_id": self.escola_id,
            "atribuicoes": [
                {
                    "etapa": "EDUCAÇÃO INFANTIL",
                    "ano_serie": "PRÉ II",
                    "turma": "ÚNICA",
                    "turno": "TARDE",
                    "disciplina": "EDUCAÇÃO INFANTIL",
                    "dias_semana": ["SEG", "TER", "QUA", "QUI", "SEX"],
                    "carga_horaria": 20,
                    "habilitacao": "HABILITADO"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/docentes-completos",
            headers=self.headers,
            json=docente_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        atribuicao = data["atribuicoes"][0]
        assert atribuicao["etapa"] == "EDUCAÇÃO INFANTIL"
        assert atribuicao["ano_serie"] == "PRÉ II"
        assert atribuicao["turma"] == "ÚNICA"
        assert atribuicao["turno"] == "TARDE"
        
        print(f"✓ Created Educação Infantil docente: {data['nome']}")
        print(f"  - Lotação: {atribuicao['etapa']} / {atribuicao['ano_serie']} / Turma {atribuicao['turma']} / {atribuicao['turno']}")
        
        return data["id"]
    
    def test_create_docente_multiple_lotacoes(self):
        """Test creating a docente with multiple lotações"""
        docente_data = {
            "nome": "TEST_Professor Múltiplas Lotações",
            "cpf": "11122233344",
            "vinculo": "EFETIVO",
            "funcao": "PROFESSOR",
            "carga_horaria_semanal": 40,
            "escola_id": self.escola_id,
            "atribuicoes": [
                {
                    "etapa": "ENSINO FUNDAMENTAL - ANOS FINAIS",
                    "ano_serie": "6º ANO",
                    "turma": "A",
                    "turno": "MANHÃ",
                    "disciplina": "MATEMÁTICA",
                    "dias_semana": ["SEG", "QUA", "SEX"],
                    "carga_horaria": 12,
                    "habilitacao": "HABILITADO"
                },
                {
                    "etapa": "ENSINO FUNDAMENTAL - ANOS FINAIS",
                    "ano_serie": "7º ANO",
                    "turma": "B",
                    "turno": "MANHÃ",
                    "disciplina": "MATEMÁTICA",
                    "dias_semana": ["TER", "QUI"],
                    "carga_horaria": 8,
                    "habilitacao": "HABILITADO"
                },
                {
                    "etapa": "EJA",
                    "ano_serie": "EJA II",
                    "turma": "A",
                    "turno": "NOITE",
                    "disciplina": "MATEMÁTICA",
                    "dias_semana": ["SEG", "TER", "QUA"],
                    "carga_horaria": 10,
                    "habilitacao": "HABILITADO"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/docentes-completos",
            headers=self.headers,
            json=docente_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["atribuicoes"]) == 3
        
        # Verify different turnos
        turnos = [a["turno"] for a in data["atribuicoes"]]
        assert "MANHÃ" in turnos
        assert "NOITE" in turnos
        
        print(f"✓ Created docente with {len(data['atribuicoes'])} lotações")
        for i, a in enumerate(data["atribuicoes"]):
            print(f"  - Lotação {i+1}: {a['etapa']} / {a['ano_serie']} / Turma {a['turma']} / {a['turno']} / {a['disciplina']}")
        
        return data["id"]
    
    def test_update_docente_lotacao(self):
        """Test updating a docente's lotação"""
        # First create a docente
        create_data = {
            "nome": "TEST_Professor Para Atualizar",
            "cpf": "55566677788",
            "vinculo": "EFETIVO",
            "funcao": "PROFESSOR",
            "carga_horaria_semanal": 40,
            "escola_id": self.escola_id,
            "atribuicoes": [
                {
                    "etapa": "ENSINO FUNDAMENTAL - ANOS INICIAIS",
                    "ano_serie": "1º ANO",
                    "turma": "A",
                    "turno": "MANHÃ",
                    "disciplina": "POLIVALENTE",
                    "carga_horaria": 20,
                    "habilitacao": "HABILITADO"
                }
            ]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/docentes-completos",
            headers=self.headers,
            json=create_data
        )
        assert create_response.status_code == 200
        docente_id = create_response.json()["id"]
        
        # Now update the lotação
        update_data = {
            "nome": "TEST_Professor Para Atualizar",
            "cpf": "55566677788",
            "vinculo": "EFETIVO",
            "funcao": "PROFESSOR",
            "carga_horaria_semanal": 40,
            "atribuicoes": [
                {
                    "etapa": "ENSINO FUNDAMENTAL - ANOS INICIAIS",
                    "ano_serie": "2º ANO",  # Changed from 1º to 2º
                    "turma": "B",  # Changed from A to B
                    "turno": "TARDE",  # Changed from MANHÃ to TARDE
                    "disciplina": "POLIVALENTE",
                    "carga_horaria": 20,
                    "habilitacao": "HABILITADO"
                }
            ]
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/docentes-completos/{docente_id}",
            headers=self.headers,
            json=update_data
        )
        assert update_response.status_code == 200
        
        # Verify the update
        get_response = requests.get(
            f"{BASE_URL}/api/docentes-completos/{docente_id}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        data = get_response.json()
        
        atribuicao = data["atribuicoes"][0]
        assert atribuicao["ano_serie"] == "2º ANO"
        assert atribuicao["turma"] == "B"
        assert atribuicao["turno"] == "TARDE"
        
        print(f"✓ Updated docente lotação successfully")
        print(f"  - New lotação: {atribuicao['ano_serie']} / Turma {atribuicao['turma']} / {atribuicao['turno']}")
        
        return docente_id
    
    def test_list_docentes_completos(self):
        """Test listing docentes completos"""
        response = requests.get(
            f"{BASE_URL}/api/docentes-completos",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check that docentes have the new lotação fields
        for docente in data:
            if docente.get("atribuicoes"):
                for atribuicao in docente["atribuicoes"]:
                    # These fields should exist (may be null/empty)
                    assert "etapa" in atribuicao
                    assert "disciplina" in atribuicao
                    # New fields
                    if "ano_serie" in atribuicao:
                        print(f"  - {docente['nome']}: {atribuicao.get('ano_serie')} / Turma {atribuicao.get('turma')} / {atribuicao.get('turno')}")
        
        print(f"✓ Listed {len(data)} docentes completos")
        return data
    
    def test_turno_integral(self):
        """Test creating a docente with INTEGRAL turno"""
        docente_data = {
            "nome": "TEST_Professor Integral",
            "cpf": "99988877766",
            "vinculo": "EFETIVO",
            "funcao": "PROFESSOR",
            "carga_horaria_semanal": 40,
            "escola_id": self.escola_id,
            "atribuicoes": [
                {
                    "etapa": "ENSINO FUNDAMENTAL - ANOS INICIAIS",
                    "ano_serie": "4º ANO",
                    "turma": "A",
                    "turno": "INTEGRAL",
                    "disciplina": "POLIVALENTE",
                    "dias_semana": ["SEG", "TER", "QUA", "QUI", "SEX"],
                    "carga_horaria": 40,
                    "habilitacao": "HABILITADO"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/docentes-completos",
            headers=self.headers,
            json=docente_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        atribuicao = data["atribuicoes"][0]
        assert atribuicao["turno"] == "INTEGRAL"
        
        print(f"✓ Created docente with INTEGRAL turno: {data['nome']}")
        
        return data["id"]


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get escola token for cleanup"""
        response = requests.post(f"{BASE_URL}/api/auth/escola/login", json={
            "codigo_inep": ESCOLA_INEP,
            "cpf": ESCOLA_CPF,
            "senha": ESCOLA_SENHA
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Escola authentication failed")
    
    def test_cleanup_test_docentes(self):
        """Clean up TEST_ prefixed docentes"""
        # Get all docentes
        response = requests.get(
            f"{BASE_URL}/api/docentes-completos",
            headers=self.headers
        )
        
        if response.status_code == 200:
            docentes = response.json()
            deleted_count = 0
            
            for docente in docentes:
                if docente["nome"].startswith("TEST_"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/docentes-completos/{docente['id']}",
                        headers=self.headers
                    )
                    if delete_response.status_code == 200:
                        deleted_count += 1
            
            print(f"✓ Cleaned up {deleted_count} test docentes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
