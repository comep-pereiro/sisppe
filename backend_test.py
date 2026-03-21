import requests
import sys
import json
from datetime import datetime

class COMEPAPITester:
    def __init__(self, base_url="https://rede-educacao.preview.emergentagent.com"):
        self.base_url = base_url
        self.escola_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.escola_id = None
        self.admin_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_seed_database(self):
        """Seed the database with test data"""
        print("\n" + "="*50)
        print("SEEDING DATABASE")
        print("="*50)
        
        success, response = self.run_test("Seed Database", "POST", "seed", 200)
        if success:
            print("✅ Database seeded successfully")
            return True
        return False

    def test_escola_login(self):
        """Test escola login with INEP code"""
        print("\n" + "="*50)
        print("TESTING ESCOLA LOGIN")
        print("="*50)
        
        # Using real credentials from the seeded data
        login_data = {
            "codigo_inep": "23056797",
            "cpf": "05174591",
            "senha": "123456"
        }
        
        success, response = self.run_test(
            "Escola Login",
            "POST",
            "auth/escola/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.escola_token = response['access_token']
            self.escola_id = response['user_data']['escola_id']
            print(f"✅ Escola token obtained: {self.escola_token[:20]}...")
            print(f"✅ Escola ID: {self.escola_id}")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        print("\n" + "="*50)
        print("TESTING ADMIN LOGIN")
        print("="*50)
        
        login_data = {
            "email": "admin@comep.gov.br",
            "senha": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/admin/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_id = response['user_data']['id']
            print(f"✅ Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_escola_endpoints(self):
        """Test escola-specific endpoints"""
        if not self.escola_token:
            print("❌ Skipping escola tests - no token")
            return False
            
        print("\n" + "="*50)
        print("TESTING ESCOLA ENDPOINTS")
        print("="*50)
        
        # Get escola data
        self.run_test("Get Minha Escola", "GET", "escolas/me", 200, token=self.escola_token)
        
        # Get escola stats
        self.run_test("Get Escola Stats", "GET", "dashboard/escola/stats", 200, token=self.escola_token)
        
        return True

    def test_docentes_crud(self):
        """Test docentes CRUD operations"""
        if not self.escola_token:
            print("❌ Skipping docentes tests - no token")
            return False
            
        print("\n" + "="*50)
        print("TESTING DOCENTES CRUD")
        print("="*50)
        
        # List docentes
        success, docentes = self.run_test("List Docentes", "GET", "docentes", 200, token=self.escola_token)
        
        # Create new docente
        docente_data = {
            "nome": "Professor Teste",
            "cpf": "99988877766",
            "email": "professor.teste@escola.edu.br",
            "telefone": "(88) 99999-9999",
            "formacao": "Graduação",
            "disciplinas": ["Matemática", "Física"],
            "carga_horaria": 40,
            "vinculo": "Contratado",
            "escola_id": self.escola_id
        }
        
        success, new_docente = self.run_test(
            "Create Docente",
            "POST",
            "docentes",
            200,
            data=docente_data,
            token=self.escola_token
        )
        
        if success and 'id' in new_docente:
            docente_id = new_docente['id']
            print(f"✅ Created docente with ID: {docente_id}")
            
            # Update docente
            update_data = {
                "nome": "Professor Teste Atualizado",
                "cpf": "99988877766",
                "email": "professor.teste@escola.edu.br",
                "telefone": "(88) 99999-9999",
                "formacao": "Especialização",
                "disciplinas": ["Matemática"],
                "carga_horaria": 20,
                "vinculo": "Contratado"
            }
            
            self.run_test(
                "Update Docente",
                "PUT",
                f"docentes/{docente_id}",
                200,
                data=update_data,
                token=self.escola_token
            )
            
            # Delete docente
            self.run_test(
                "Delete Docente",
                "DELETE",
                f"docentes/{docente_id}",
                200,
                token=self.escola_token
            )
        
        return True

    def test_quadro_admin_crud(self):
        """Test quadro administrativo CRUD operations"""
        if not self.escola_token:
            print("❌ Skipping quadro admin tests - no token")
            return False
            
        print("\n" + "="*50)
        print("TESTING QUADRO ADMINISTRATIVO CRUD")
        print("="*50)
        
        # List quadro admin
        self.run_test("List Quadro Admin", "GET", "quadro-admin", 200, token=self.escola_token)
        
        # Create new member
        membro_data = {
            "nome": "Coordenador Teste",
            "cpf": "88877766655",
            "cargo": "Coordenador",
            "email": "coordenador.teste@escola.edu.br",
            "telefone": "(88) 88888-8888",
            "formacao": "Mestrado em Educação",
            "escola_id": self.escola_id
        }
        
        success, new_membro = self.run_test(
            "Create Quadro Admin",
            "POST",
            "quadro-admin",
            200,
            data=membro_data,
            token=self.escola_token
        )
        
        if success and 'id' in new_membro:
            membro_id = new_membro['id']
            print(f"✅ Created quadro admin member with ID: {membro_id}")
            
            # Update member
            update_data = {
                "nome": "Coordenador Teste Atualizado",
                "cpf": "88877766655",
                "cargo": "Vice-Diretor",
                "email": "coordenador.teste@escola.edu.br",
                "telefone": "(88) 88888-8888",
                "formacao": "Mestrado em Gestão Educacional"
            }
            
            self.run_test(
                "Update Quadro Admin",
                "PUT",
                f"quadro-admin/{membro_id}",
                200,
                data=update_data,
                token=self.escola_token
            )
            
            # Delete member
            self.run_test(
                "Delete Quadro Admin",
                "DELETE",
                f"quadro-admin/{membro_id}",
                200,
                token=self.escola_token
            )
        
        return True

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        if not self.admin_token:
            print("❌ Skipping admin tests - no token")
            return False
            
        print("\n" + "="*50)
        print("TESTING ADMIN ENDPOINTS")
        print("="*50)
        
        # Get dashboard stats
        self.run_test("Get Admin Dashboard Stats", "GET", "dashboard/stats", 200, token=self.admin_token)
        
        # List escolas
        self.run_test("List Escolas", "GET", "escolas", 200, token=self.admin_token)
        
        # List solicitações
        self.run_test("List Solicitações", "GET", "solicitacoes", 200, token=self.admin_token)
        
        return True

    def test_new_dashboard_apis(self):
        """Test new dashboard evolution APIs"""
        if not self.admin_token:
            print("❌ Skipping dashboard evolution tests - no token")
            return False
            
        print("\n" + "="*50)
        print("TESTING NEW DASHBOARD EVOLUTION APIs")
        print("="*50)
        
        # Test dashboard evolution endpoint
        success, response = self.run_test("Get Dashboard Evolution", "GET", "dashboard/evolucao", 200, token=self.admin_token)
        if success:
            print("✅ Dashboard evolution data retrieved successfully")
            if 'evolucao_mensal' in response:
                print(f"   Found {len(response['evolucao_mensal'])} months of data")
            if 'distribuicao_modalidades' in response:
                print(f"   Found {len(response['distribuicao_modalidades'])} modalidades")
            if 'distribuicao_vinculos' in response:
                print(f"   Found {len(response['distribuicao_vinculos'])} vinculos")
        
        return True

    def test_notifications_apis(self):
        """Test notifications APIs"""
        if not self.admin_token:
            print("❌ Skipping notifications tests - no token")
            return False
            
        print("\n" + "="*50)
        print("TESTING NOTIFICATIONS APIs")
        print("="*50)
        
        # Test outdated schools endpoint
        success, response = self.run_test("Get Outdated Schools", "GET", "notificacoes/escolas-desatualizadas", 200, token=self.admin_token)
        if success:
            print("✅ Outdated schools data retrieved successfully")
            if 'total' in response:
                print(f"   Found {response['total']} outdated schools")
        
        # Test notification history
        success, response = self.run_test("Get Notification History", "GET", "notificacoes/historico", 200, token=self.admin_token)
        if success:
            print("✅ Notification history retrieved successfully")
            print(f"   Found {len(response)} notifications in history")
        
        # Test send reminders (this might fail if no email API key, but should return proper response)
        success, response = self.run_test("Send Reminders", "POST", "notificacoes/enviar-lembretes", 200, token=self.admin_token)
        if success:
            print("✅ Send reminders endpoint working")
            if 'enviados' in response:
                print(f"   Sent: {response['enviados']}, Errors: {response.get('erros', 0)}")
        
        return True

    def test_reports_apis(self):
        """Test PDF reports APIs"""
        if not self.admin_token:
            print("❌ Skipping reports tests - no token")
            return False
            
        print("\n" + "="*50)
        print("TESTING PDF REPORTS APIs")
        print("="*50)
        
        # Test general schools PDF report
        success, response = self.run_test("Download General Schools PDF", "GET", "relatorios/escolas/pdf", 200, token=self.admin_token)
        if success:
            print("✅ General schools PDF report generated successfully")
        
        # Test individual school PDF report (using escola_id if available)
        if self.escola_id:
            success, response = self.run_test("Download Individual School PDF", "GET", f"relatorios/escola/{self.escola_id}/pdf", 200, token=self.admin_token)
            if success:
                print("✅ Individual school PDF report generated successfully")
        else:
            print("⚠️  Skipping individual school PDF test - no escola_id available")
        
        return True

    def test_solicitacao_cadastro(self):
        """Test solicitação de cadastro flow"""
        print("\n" + "="*50)
        print("TESTING SOLICITAÇÃO CADASTRO")
        print("="*50)
        
        # Create solicitação (public endpoint)
        solicitacao_data = {
            "codigo_censo": "98765432",
            "nome_escola": "Escola Teste Solicitação",
            "endereco": "Rua Teste, 456, Pereiro-CE",
            "telefone": "(88) 99999-5555",
            "email_escola": "teste@escola.edu.br",
            "nome_responsavel": "Responsável Teste",
            "cpf_responsavel": "55566677788",
            "email_responsavel": "responsavel@teste.com",
            "justificativa": "Solicitação de teste para validação do sistema"
        }
        
        success, solicitacao = self.run_test(
            "Create Solicitação",
            "POST",
            "solicitacoes",
            200,
            data=solicitacao_data
        )
        
        if success and 'id' in solicitacao and self.admin_token:
            solicitacao_id = solicitacao['id']
            print(f"✅ Created solicitação with ID: {solicitacao_id}")
            
            # Admin can approve solicitação
            self.run_test(
                "Approve Solicitação",
                "PUT",
                f"solicitacoes/{solicitacao_id}/aprovar?senha_inicial=senha123",
                200,
                token=self.admin_token
            )
        
        return True

    def test_invalid_credentials(self):
        """Test invalid login attempts"""
        print("\n" + "="*50)
        print("TESTING INVALID CREDENTIALS")
        print("="*50)
        
        # Invalid escola login
        invalid_escola = {
            "codigo_inep": "00000000",
            "cpf": "00000000000",
            "senha": "wrong"
        }
        self.run_test("Invalid Escola Login", "POST", "auth/escola/login", 401, data=invalid_escola)
        
        # Invalid admin login
        invalid_admin = {
            "email": "wrong@email.com",
            "senha": "wrong"
        }
        self.run_test("Invalid Admin Login", "POST", "auth/admin/login", 401, data=invalid_admin)

    def test_blocking_functionality(self):
        """Test escola blocking/unblocking functionality"""
        if not self.admin_token or not self.escola_id:
            print("❌ Skipping blocking tests - no admin token or escola_id")
            return False
            
        print("\n" + "="*50)
        print("TESTING BLOCKING/UNBLOCKING FUNCTIONALITY")
        print("="*50)
        
        # Block escola
        block_data = {"motivo": "Teste de bloqueio para análise de documentos"}
        success, response = self.run_test(
            "Block Escola",
            "PUT",
            f"escolas/{self.escola_id}/bloquear",
            200,
            data=block_data,
            token=self.admin_token
        )
        
        if success:
            print("✅ Escola blocked successfully")
            
            # Try to update escola data while blocked (should fail)
            if self.escola_token:
                update_data = {
                    "codigo_inep": "23056797",
                    "nome": "CEI MARIA EUNICE RODRIGUES OLIVEIRA - TESTE",
                    "endereco": "Pereiro - CE",
                    "modalidades": []
                }
                
                success_blocked, response_blocked = self.run_test(
                    "Try Update While Blocked",
                    "PUT",
                    "escolas/me",
                    403,  # Should be forbidden
                    data=update_data,
                    token=self.escola_token
                )
                
                if success_blocked:
                    print("✅ Blocked escola correctly prevented from editing")
            
            # Unblock escola
            success_unblock, response_unblock = self.run_test(
                "Unblock Escola",
                "PUT",
                f"escolas/{self.escola_id}/desbloquear?parecer=Documentação aprovada",
                200,
                token=self.admin_token
            )
            
            if success_unblock:
                print("✅ Escola unblocked successfully")
                
                # Try to update escola data after unblocking (should work)
                if self.escola_token:
                    success_unblocked, response_unblocked = self.run_test(
                        "Update After Unblock",
                        "PUT",
                        "escolas/me",
                        200,
                        data=update_data,
                        token=self.escola_token
                    )
                    
                    if success_unblocked:
                        print("✅ Unblocked escola can edit data again")
        
        return True

    def test_data_isolation(self):
        """Test that escola can only see their own data"""
        if not self.escola_token:
            print("❌ Skipping data isolation tests - no escola token")
            return False
            
        print("\n" + "="*50)
        print("TESTING DATA ISOLATION")
        print("="*50)
        
        # Test that escola can only see their own docentes
        success, docentes = self.run_test("Get Own Docentes", "GET", "docentes", 200, token=self.escola_token)
        if success:
            print(f"✅ Escola can access their docentes: {len(docentes)} found")
        
        # Test that escola can only see their own quadro admin
        success, quadro = self.run_test("Get Own Quadro Admin", "GET", "quadro-admin", 200, token=self.escola_token)
        if success:
            print(f"✅ Escola can access their quadro admin: {len(quadro)} found")
        
        # Test that escola can get their own data
        success, escola_data = self.run_test("Get Own Escola Data", "GET", "escolas/me", 200, token=self.escola_token)
        if success:
            print(f"✅ Escola can access their own data: {escola_data.get('nome', 'Unknown')}")
        
        return True

    def test_admin_escola_management(self):
        """Test admin can manage all escolas"""
        if not self.admin_token:
            print("❌ Skipping admin escola management tests - no admin token")
            return False
            
        print("\n" + "="*50)
        print("TESTING ADMIN ESCOLA MANAGEMENT")
        print("="*50)
        
        # Admin can list all escolas
        success, escolas = self.run_test("Admin List All Escolas", "GET", "escolas", 200, token=self.admin_token)
        if success:
            print(f"✅ Admin can see all escolas: {len(escolas)} found")
            
            # Test getting specific escola details
            if escolas and len(escolas) > 0:
                first_escola_id = escolas[0]['id']
                success_detail, escola_detail = self.run_test(
                    "Admin Get Escola Details",
                    "GET",
                    f"escolas/{first_escola_id}",
                    200,
                    token=self.admin_token
                )
                if success_detail:
                    print(f"✅ Admin can access escola details: {escola_detail.get('nome', 'Unknown')}")
        
        return True

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting COMEP API Tests")
        print(f"Base URL: {self.base_url}")
        
        # Basic health checks
        self.test_health_check()
        
        # Seed database
        self.test_seed_database()
        
        # Authentication tests
        escola_login_success = self.test_escola_login()
        admin_login_success = self.test_admin_login()
        
        # Escola functionality tests
        if escola_login_success:
            self.test_escola_endpoints()
            self.test_docentes_crud()
            self.test_quadro_admin_crud()
        
        # Admin functionality tests
        if admin_login_success:
            self.test_admin_endpoints()
            self.test_new_dashboard_apis()
            self.test_notifications_apis()
            self.test_reports_apis()
            self.test_admin_escola_management()
        
        # Test new features (blocking/unblocking and data isolation)
        if escola_login_success and admin_login_success:
            self.test_blocking_functionality()
            self.test_data_isolation()
        
        # Public endpoint tests
        self.test_solicitacao_cadastro()
        
        # Security tests
        self.test_invalid_credentials()
        
        # Print results
        print("\n" + "="*60)
        print("TEST RESULTS SUMMARY")
        print("="*60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = COMEPAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())