# WardFlow

WardFlow is a role-based ward operations dashboard for a 74-bed quarantine centre. It helps staff track daily temperatures, doctor visits, discharge eligibility, bed availability, and outcome reporting from a single browser-based interface.

The app is a demonstration product. Its rules and thresholds are illustrative and are not medical advice.

## What it supports

- **Nurses** record one official temperature per active patient each day and can correct today's value with an audit reason.
- **Doctors** record daily visits, review fever alerts, approve eligible discharges, and record deaths.
- **Administrators** register patients into available beds and complete doctor-approved discharges.
- **Head doctors** can review operational dashboards and reports.
- All staff can browse patients, temperature status, visits, and closed-case reports according to the role selected in the app.

## Key rules

WardFlow applies its workflow rules in the application logic, rather than relying only on which controls are displayed.

| Area | Rule |
| --- | --- |
| Capacity | The ward has 74 beds. A patient can only be registered to a free bed. |
| Temperatures | Only nurses can record or correct temperatures. One reading is allowed per patient per day; corrections require a reason and are limited to the current day. |
| Temperature validation | Readings must be between 34°C and 42°C. Values below 35°C or above 41°C require confirmation in the interface. |
| Visits | Only doctors can record a visit, after the patient's temperature has been recorded for that day. |
| Discharge approval | A doctor may approve discharge after three consecutive recorded fever-free days, including today, and a doctor visit today. |
| Discharge completion | Only an administrator can complete an approved discharge; this releases the patient's bed. |
| Mortality reporting | Mortality is calculated as deaths divided by closed cases. The dashboard flags a rate above 15% and notes when fewer than 20 closed cases are available. |

## Pages

- **Dashboard** — role-specific daily overview, including pending readings, fever alerts, discharges, and capacity.
- **Patients** — searchable patient list and patient details.
- **Temperatures** — outstanding and completed readings plus correction history.
- **Doctor visits & discharge** — visit status, fever-free streaks, and discharge eligibility.
- **Beds & discharge** — occupancy grid, admissions, and discharge completion.
- **Reports** — recovery, death, and mortality summaries with closed cases.

## Technology

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite
- Tailwind CSS and Radix UI components
- Vitest and Testing Library

## Getting started

Prerequisites: Node.js 20+ and npm.

```sh
git clone <repository-url>
cd WardFlow
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run preview` | Preview a production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run the test suite once. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run format` | Format files with Prettier. |

## Data and architecture

WardFlow has no backend or external database. It seeds fictional demo data on first load and stores changes in browser `localStorage`. Clearing site data, or using the in-app reset option, returns the app to its demo state.

Business rules live in [`src/lib/wardflow/logic.ts`](src/lib/wardflow/logic.ts) as pure functions. Components execute mutations through `useWard().run`, so the selected role is checked at the action boundary. The state provider in [`src/lib/wardflow/store.tsx`](src/lib/wardflow/store.tsx) handles loading and persisting browser data. Routes are file-based TanStack Router routes under [`src/routes`](src/routes).

## Testing

The test suite covers core ward rules such as temperature validation, permissions, visits, discharge sequencing, bed allocation, and mortality calculation. Run it with:

```sh
npm run test
```

## Project status

WardFlow is intended for product demonstration and prototyping. Do not use it to make clinical decisions or to manage real patient records.

## Lovable sync

This project is connected to [Lovable](https://lovable.dev). Avoid force-pushing or rewriting published Git history, since pushed commits sync back to the Lovable project.
