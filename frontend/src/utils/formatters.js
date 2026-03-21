/**
 * Utilitários de formatação para campos brasileiros
 */

// Formata CPF: 123.456.789-00
export const formatCPF = (value) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// Remove formatação do CPF
export const unformatCPF = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Valida CPF
export const validateCPF = (cpf) => {
  const numbers = unformatCPF(cpf);
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

// Formata Telefone: (88) 99999-9999 ou (88) 3527-1580
export const formatPhone = (value) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 2) {
    return `(${numbers}`;
  }
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

// Remove formatação do telefone
export const unformatPhone = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Formata CEP: 63460-000
export const formatCEP = (value) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, '$1-$2');
};

// Remove formatação do CEP
export const unformatCEP = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Formata CNPJ: 07.570.518/0001-00
export const formatCNPJ = (value) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

// Remove formatação do CNPJ
export const unformatCNPJ = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Formata RG (formato genérico)
export const formatRG = (value) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '').slice(0, 9);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}-${numbers.slice(8)}`;
};

// Formata número com separador de milhares
export const formatNumber = (value) => {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Formata área em m²
export const formatArea = (value) => {
  if (!value && value !== 0) return '';
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} m²`;
};

// Formata data para exibição: DD/MM/AAAA
export const formatDate = (value) => {
  if (!value) return '';
  // Se já está no formato ISO
  if (value.includes('-')) {
    const [year, month, day] = value.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }
  return value;
};

// Converte data de DD/MM/AAAA para AAAA-MM-DD
export const parseDate = (value) => {
  if (!value) return '';
  if (value.includes('/')) {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }
  return value;
};
