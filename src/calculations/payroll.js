export function calculatePayroll(employee, settings) {
  const salary = Math.max(0, Number(employee.salary) || 0);
  const normalHours = Math.max(0, Number(employee.normalHours) || 0);
  const otHours = Math.max(0, Number(employee.otHours) || 0);
  const divisor = Math.max(1, Number(settings.divisor) || 200);
  const otMultiplier = Math.max(0, Number(settings.otMultiplier) || 1.25);
  // Matches the user's Excel sheet exactly:
  // Amt = Hour * Salary / Divisor
  // OT Amt = OT Hour * Salary / Divisor * OT multiplier
  const normalRate = salary / divisor;
  const normalAmount = normalHours * normalRate;
  const otRate = normalRate * otMultiplier;
  const otAmount = otHours * otRate;
  const extraAmount = otAmount;
  const holidayRate = 0;
  const holidayAmount = 0;
  return {
    normalRate, normalAmount, holidayRate, holidayAmount,
    otRate, otAmount, extraAmount,
    totalPayable: normalAmount + otAmount
  };
}
export const DEFAULT_SETTINGS = { divisor: 200, otMultiplier: 1.25 };
export const DEMO_EMPLOYEES = [
  { id: 'EMP-001', name: 'INTKHAB', salary: 3250, normalHours: 38, holidayHours: 0, otHours: 17 },
  { id: 'EMP-002', name: 'JOJO', salary: 1650, normalHours: 31, holidayHours: 0, otHours: 3 },
  { id: 'EMP-003', name: 'ZEESAN', salary: 1400, normalHours: 37, holidayHours: 0, otHours: 4 },
  { id: 'EMP-004', name: 'ALTAB', salary: 900, normalHours: 37, holidayHours: 0, otHours: 4 },
  { id: 'EMP-005', name: 'MUSTAKEEM', salary: 1500, normalHours: 50, holidayHours: 0, otHours: 7 },
  { id: 'EMP-006', name: 'RAJA BABU', salary: 1350, normalHours: 42, holidayHours: 0, otHours: 5 },
  { id: 'EMP-007', name: 'SHAMSER', salary: 1550, normalHours: 39, holidayHours: 0, otHours: 5 },
  { id: 'EMP-008', name: 'NASEEM', salary: 1500, normalHours: 5, holidayHours: 0, otHours: 4 },
  { id: 'EMP-009', name: 'NAUSHAD', salary: 1350, normalHours: 36, holidayHours: 0, otHours: 4 },
  { id: 'EMP-010', name: 'ABDUL KHALIK', salary: 1650, normalHours: 29, holidayHours: 0, otHours: 5 },
  { id: 'EMP-011', name: 'GULZAR', salary: 1400, normalHours: 42, holidayHours: 0, otHours: 5 },
  { id: 'EMP-012', name: 'ABDUL QADIR', salary: 1650, normalHours: 52, holidayHours: 0, otHours: 7 },
  { id: 'EMP-013', name: 'SALIM', salary: 1500, normalHours: 54, holidayHours: 0, otHours: 3 },
  { id: 'EMP-014', name: 'SAMSON', salary: 3500, normalHours: 17, holidayHours: 0, otHours: 4 },
  { id: 'EMP-015', name: 'SHAHZAD', salary: 4000, normalHours: 39, holidayHours: 0, otHours: 8 },
  { id: 'EMP-016', name: 'RAFEEK', salary: 1400, normalHours: 18, holidayHours: 0, otHours: 4 }
];
