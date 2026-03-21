"""
COMEP API Tests - Sistema de Monitoramento de Escolas
Tests for authentication, escola management, blocking/unblocking, and PDF reports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pereiro-escolas.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@comep.gov.br"
ADMIN_SENHA = "admin123"
ESCOLA_INEP = "23056797"
ESCOLA_CPF = "05174591"
ESCOLA_SENHA = "123456"


class TestHealthAndSeed:
    """Health check and database seeding tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_seed_database(self):
        """Seed database with initial data"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        # Either already seeded or newly seeded
        assert "message" in data
        print(f"✓ Seed response: {data['message']}")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_SENHA
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user_type"] == "admin"
        assert data["user_data"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful - User: {data['user_data']['nome']}")
        return data["access_token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": "wrong@email.com",
            "senha": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid admin credentials rejected correctly")
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "senha": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Wrong admin password rejected correctly")


class TestEscolaAuth:
    """Escola authentication tests"""
    
    def test_escola_login_success(self):
        """Test escola login with INEP code, CPF and password"""
        response = requests.post(f"{BASE_URL}/api/auth/escola/login", json={
            "codigo_inep": ESCOLA_INEP,
            "cpf": ESCOLA_CPF,
            "senha": ESCOLA_SENHA
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user_type"] == "escola"
        assert data["user_data"]["escola_codigo_inep"] == ESCOLA_INEP
        print(f"✓ Escola login successful - Escola: {data['user_data']['escola_nome']}")
        return data["access_token"]
    
    def test_escola_login_invalid_inep(self):
        """Test escola login with invalid INEP code"""
        response = requests.post(f"{BASE_URL}/api/auth/escola/login", json={
            "codigo_inep": "99999999",
            "cpf": ESCOLA_CPF,
            "senha": ESCOLA_SENHA
        })
        assert response.status_code == 401
        print("✓ Invalid INEP code rejected correctly")
    
    def test_escola_login_invalid_cpf(self):
        """Test escola login with invalid CPF"""
        response = requests.post(f"{BASE_URL}/api/auth/escola/login", json={
            "codigo_inep": ESCOLA_INEP,
            "cpf": "00000000000",
            "senha": ESCOLA_SENHA
        })
        assert response.status_code == 401
        print("✓ Invalid CPF rejected correctly")
    
    def test_escola_login_wrong_password(self):
        """Test escola login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/escola/login", json={
            "codigo_inep": ESCOLA_INEP,
            "cpf": ESCOLA_CPF,
            "senha": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Wrong escola password rejected correctly")


class TestEscolasAdmin:
    """Admin escola management tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_SENHA
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_list_escolas(self):
        """Test listing all escolas (admin)"""
        response = requests.get(f"{BASE_URL}/api/escolas", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 18  # Should have 18 schools from seed
        print(f"✓ Listed {len(data)} escolas")
        
        # Verify escola structure
        if len(data) > 0:
            escola = data[0]
            assert "id" in escola
            assert "codigo_inep" in escola
            assert "nome" in escola
            assert "situacao" in escola
            print(f"✓ First escola: {escola['nome']} (INEP: {escola['codigo_inep']})")
    
    def test_get_escola_by_id(self):
        """Test getting escola details by ID"""
        # First get list to get an ID
        list_response = requests.get(f"{BASE_URL}/api/escolas", headers=self.headers)
        assert list_response.status_code == 200
        escolas = list_response.json()
        
        if len(escolas) > 0:
            escola_id = escolas[0]["id"]
            response = requests.get(f"{BASE_URL}/api/escolas/{escola_id}", headers=self.headers)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == escola_id
            print(f"✓ Got escola details: {data['nome']}")
    
    def test_filter_escolas_by_situacao(self):
        """Test filtering escolas by situacao"""
        response = requests.get(f"{BASE_URL}/api/escolas", headers=self.headers, params={"situacao": "ativa"})
        assert response.status_code == 200
        data = response.json()
        for escola in data:
            assert escola["situacao"] == "ativa"
        print(f"✓ Filtered {len(data)} active escolas")
    
    def test_list_escolas_unauthorized(self):
        """Test listing escolas without auth"""
        response = requests.get(f"{BASE_URL}/api/escolas")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access to escolas rejected")


class TestEscolaBlockUnblock:
    """Escola blocking/unblocking tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and escola ID for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_SENHA
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            
            # Get first escola ID
            escolas_response = requests.get(f"{BASE_URL}/api/escolas", headers=self.headers)
            if escolas_response.status_code == 200 and len(escolas_response.json()) > 0:
                self.escola_id = escolas_response.json()[0]["id"]
            else:
                pytest.skip("No escolas available for testing")
        else:
            pytest.skip("Admin authentication failed")
    
    def test_block_escola(self):
        """Test blocking an escola"""
        response = requests.put(
            f"{BASE_URL}/api/escolas/{self.escola_id}/bloquear",
            headers=self.headers,
            json={"motivo": "Análise de documentação para teste"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Escola blocked successfully")
        
        # Verify escola is blocked
        escola_response = requests.get(f"{BASE_URL}/api/escolas/{self.escola_id}", headers=self.headers)
        assert escola_response.status_code == 200
        escola = escola_response.json()
        assert escola["bloqueado"] == True
        assert escola["motivo_bloqueio"] == "Análise de documentação para teste"
        print(f"✓ Verified escola is blocked with correct motivo")
    
    def test_unblock_escola(self):
        """Test unblocking an escola"""
        # First ensure escola is blocked
        requests.put(
            f"{BASE_URL}/api/escolas/{self.escola_id}/bloquear",
            headers=self.headers,
            json={"motivo": "Teste de bloqueio"}
        )
        
        # Now unblock
        response = requests.put(
            f"{BASE_URL}/api/escolas/{self.escola_id}/desbloquear",
            headers=self.headers,
            params={"parecer": "Documentação aprovada"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Escola unblocked successfully")
        
        # Verify escola is unblocked
        escola_response = requests.get(f"{BASE_URL}/api/escolas/{self.escola_id}", headers=self.headers)
        assert escola_response.status_code == 200
        escola = escola_response.json()
        assert escola["bloqueado"] == False
        print(f"✓ Verified escola is unblocked")


class TestDashboard:
    """Dashboard stats tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_SENHA
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_admin_dashboard_stats(self):
        """Test admin dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_escolas" in data
        assert "escolas_ativas" in data
        assert "escolas_em_analise" in data
        assert "total_docentes" in data
        assert data["total_escolas"] >= 18
        print(f"✓ Dashboard stats: {data['total_escolas']} escolas, {data['escolas_ativas']} ativas")
    
    def test_dashboard_evolucao(self):
        """Test dashboard evolution data"""
        response = requests.get(f"{BASE_URL}/api/dashboard/evolucao", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "evolucao_mensal" in data
        assert "distribuicao_modalidades" in data
        assert "distribuicao_vinculos" in data
        print(f"✓ Dashboard evolution data retrieved")


class TestEscolaDashboard:
    """Escola dashboard tests"""
    
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
        else:
            pytest.skip("Escola authentication failed")
    
    def test_escola_stats(self):
        """Test escola dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/escola/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_docentes" in data
        assert "total_quadro_admin" in data
        print(f"✓ Escola stats: {data['total_docentes']} docentes, {data['total_quadro_admin']} quadro admin")
    
    def test_get_minha_escola(self):
        """Test getting own escola data"""
        response = requests.get(f"{BASE_URL}/api/escolas/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["codigo_inep"] == ESCOLA_INEP
        print(f"✓ Got minha escola: {data['nome']} (INEP: {data['codigo_inep']})")


class TestPDFReports:
    """PDF report generation tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and escola ID for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_SENHA
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            
            # Get first escola ID
            escolas_response = requests.get(f"{BASE_URL}/api/escolas", headers=self.headers)
            if escolas_response.status_code == 200 and len(escolas_response.json()) > 0:
                self.escola_id = escolas_response.json()[0]["id"]
            else:
                pytest.skip("No escolas available for testing")
        else:
            pytest.skip("Admin authentication failed")
    
    def test_general_escolas_pdf(self):
        """Test generating general escolas PDF report"""
        response = requests.get(f"{BASE_URL}/api/relatorios/escolas/pdf", headers=self.headers)
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0
        print(f"✓ General PDF report generated ({len(response.content)} bytes)")
    
    def test_individual_escola_pdf(self):
        """Test generating individual escola PDF report"""
        response = requests.get(f"{BASE_URL}/api/relatorios/escola/{self.escola_id}/pdf", headers=self.headers)
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0
        print(f"✓ Individual escola PDF report generated ({len(response.content)} bytes)")


class TestNotifications:
    """Notification system tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_SENHA
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_escolas_desatualizadas(self):
        """Test getting outdated escolas list"""
        response = requests.get(f"{BASE_URL}/api/notificacoes/escolas-desatualizadas", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "escolas" in data
        print(f"✓ Got {data['total']} outdated escolas")
    
    def test_get_historico_notificacoes(self):
        """Test getting notification history"""
        response = requests.get(f"{BASE_URL}/api/notificacoes/historico", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} notification history records")


class TestDataIsolation:
    """Data isolation tests - escola can only see own data"""
    
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
    
    def test_escola_can_only_see_own_docentes(self):
        """Test that escola can only see own docentes"""
        response = requests.get(f"{BASE_URL}/api/docentes", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        # All docentes should belong to this escola
        for docente in data:
            assert docente["escola_id"] == self.escola_id
        print(f"✓ Escola can only see own {len(data)} docentes")
    
    def test_escola_can_only_see_own_quadro_admin(self):
        """Test that escola can only see own quadro admin"""
        response = requests.get(f"{BASE_URL}/api/quadro-admin", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        # All quadro admin should belong to this escola
        for membro in data:
            assert membro["escola_id"] == self.escola_id
        print(f"✓ Escola can only see own {len(data)} quadro admin members")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
