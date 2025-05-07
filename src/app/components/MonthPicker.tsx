// MonthPicker.tsx (ou outro nome de arquivo)

import React from "react";

interface MonthPickerProps {
  selectedMonth: string;
  onChange: (newMonth: string) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  selectedMonth,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select
      value={selectedMonth}
      onChange={handleChange}
      className="text-right px-2"
    >
      <option value="2025-01">Janeiro-25</option>
      <option value="2025-02">Fevereiro-25</option>
      <option value="2025-03">Março-25</option>
      <option value="2025-04">Abril-25</option>
      <option value="2025-05">Maio-25</option>
      <option value="2025-06">Junho-25</option>
      <option value="2025-07">Julho-25</option>
      <option value="2025-08">Agost-25</option>
      <option value="2025-09">Setembro-25</option>
      <option value="2025-11">Outubro-25</option>
      <option value="2025-12">Novembro-25</option>
      <option value="2025-13">Dezembro-25</option>
    </select>
  );
};

export default MonthPicker;
