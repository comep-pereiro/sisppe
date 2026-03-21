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
        """Test escola login"""
        print("\n" + "="*50)
        print("TESTING ESCOLA LOGIN")
        print("="*50)
        
        login_data = {
            "codigo_censo": "23456789",
            "cpf": "12345678900",
            "senha": "escola123"
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
            self.escola_id = response['user_data']['id']
            print(f"✅ Escola token obtained: {self.escola_token[:20]}...")
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
            "codigo_censo": "00000000",
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