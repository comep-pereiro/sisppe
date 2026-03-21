import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { 
  formatCPF, 
  formatPhone, 
  formatCEP, 
  formatCNPJ,
  formatRG 
} from '@/utils/formatters';

/**
 * Input com máscara automática
 * @param {string} mask - Tipo de máscara: 'cpf', 'phone', 'cep', 'cnpj', 'rg'
 */
const MaskedInput = forwardRef(({ mask, value, onChange, ...props }, ref) => {
  const formatters = {
    cpf: formatCPF,
    phone: formatPhone,
    cep: formatCEP,
    cnpj: formatCNPJ,
    rg: formatRG,
  };

  const maxLengths = {
    cpf: 14,      // 123.456.789-00
    phone: 15,    // (88) 99999-9999
    cep: 9,       // 63460-000
    cnpj: 18,     // 07.570.518/0001-00
    rg: 12,       // 12.345.678-9
  };

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const formatter = formatters[mask];
    
    if (formatter) {
      const formattedValue = formatter(rawValue);
      onChange?.({
        ...e,
        target: {
          ...e.target,
          value: formattedValue
        }
      });
    } else {
      onChange?.(e);
    }
  };

  return (
    <Input
      ref={ref}
      value={value || ''}
      onChange={handleChange}
      maxLength={maxLengths[mask]}
      {...props}
    />
  );
});

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };
