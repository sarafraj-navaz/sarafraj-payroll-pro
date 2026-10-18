# Sarafraj Payroll Pro

Premium personal payroll management app built with React + Vite. Designed by Er. Sarafraj Navaz.

## Run locally

Requirements: Node.js 18+.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Salary sheet columns

The main table and Excel/PDF reports use the same column order as the supplied workbook:

`Sr | Name | Salary | Hour | Amt | OT Hour | OT Amt | Amount`

Employee ID is no longer shown anywhere in the app. Records are tracked by a hidden internal key only.

## Exact formulas

- `Amt = Hour × Salary ÷ Divisor`
- `OT Amt = OT Hour × Salary ÷ Divisor × OT multiplier`
- `Amount = Amt + OT Amt`

Default settings:
- Divisor = `200`
- OT multiplier = `1.25`

Example for INTKHAB:
- Salary = ₹3,250
- Hour = 38
- Amt = `38 × 3250 ÷ 200 = ₹617.50`
- OT Hour = 17
- OT Amt = `17 × 3250 ÷ 200 × 1.25 = ₹345.3125`
- Amount = `₹617.50 + ₹345.3125 = ₹962.8125`

Hourly calculations retain precision internally. Dashboard display uses two decimal places; the underlying amount is not rounded before totals are calculated.

## Features

- Employee create, edit, delete and search
- Automatic calculation whenever Salary, Hour, OT Hour, Divisor, or OT multiplier changes
- Excel workbook export with the exact salary-sheet columns plus separate Summary and Settings sheets
- One-click "Download PDF" button (full salary sheet) and a PDF icon on every row (single employee statement)
- CSV export and CSV/Excel import
- JSON backup and restore
- Browser-local persistence
- Responsive dark/light dashboard

## Data and privacy

Employee data is stored in this browser using localStorage. It is not sent to a server and does not automatically sync across devices. Export a JSON backup regularly.

## Notes

The app starts with sample rows based on the supplied salary sheet. Edit or delete them and enter your actual records as needed. Verify the configured formulas against your own payroll policy before using reports for official payments.
