interface MonthPickerProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const MonthPicker = ({ selectedMonth, onMonthChange }: MonthPickerProps) => {
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMonthChange(e.target.value);
  };

  return (
    <select
      value={selectedMonth}
      onChange={handleMonthChange}
      className="border rounded-lg p-2 text-sm border-purple-600"
    >
      {/* Gerando as opções de meses para o último ano */}
      {Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, "0");
        return (
          <option key={month} value={`${new Date().getFullYear()}-${month}`}>
            {month}/{new Date().getFullYear()}
          </option>
        );
      })}
    </select>
  );
};

export default MonthPicker;
