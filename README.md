# 🏥 WardFlow

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

WardFlow is a role-based operations dashboard for a 74-bed quarantine centre. It coordinates daily temperature recording, doctor visits, discharge workflows, bed availability, and outcome reporting in a browser-based prototype.

> The rules and thresholds in WardFlow are demonstration assumptions, not medical advice.

## Contents

- [Features](#-features)
- [Demo roles](#-demo-roles)
- [How the workflow works](#-how-the-workflow-works)
- [Business rules](#-business-rules)
- [Application pages](#-application-pages)
- [Getting started](#-getting-started)
- [In-app documentation](#-in-app-documentation)

## ✨ Features

- 👩‍⚕️ Nurse dashboard and daily temperature recording
- 🩺 Doctor visits, fever-free streaks, and discharge approval
- 🛏️ Bed occupancy, patient registration, and discharge completion
- 📊 Head Doctor reports and mortality monitoring
- 🔐 Role-based action permissions enforced in business logic
- 📝 Temperature correction audit history
- 💾 Browser LocalStorage persistence
- 📚 In-app workflow documentation modal

## 👥 Demo roles

| Role | Main responsibilities | Restrictions |
| --- | --- | --- |
| Nurse | Record daily temperatures and correct today's readings with a reason. | Cannot edit older readings or perform doctor/admin actions. |
| Doctor | Record visits, review fever-free streaks, approve eligible discharges, and record deaths. | Cannot record or correct temperatures. |
| Administrator | Register patients, assign free beds, and complete approved discharges. | Cannot approve clinical discharges or modify clinical records. |
| Head Doctor | Review dashboards, mortality, recoveries, deaths, and closed cases. | Read-only access. |

Role switching is simulated for demonstration; it is not authentication.

## 🔄 How the workflow works

1. **Admission:** An Admin registers a patient and assigns a free bed.
2. **Daily temperature:** A Nurse records the patient's official temperature for the day.
3. **Doctor review:** A Doctor reviews the reading and records the daily visit.
4. **Eligibility check:** WardFlow calculates the consecutive fever-free days and checks the visit requirement.
5. **Clinical approval:** A Doctor approves discharge when all rules are satisfied.
6. **Discharge completion:** An Admin completes the approved discharge and releases the bed.
7. **Outcome reporting:** The closed case appears in recovery, death, and mortality reports.

A missing temperature reading does not count as a fever-free day. Doctor approval and Admin discharge completion are separate actions: approval retains the patient's bed, while completion closes the case and releases it.

## 📏 Business rules

| Area | Implemented rule |
| --- | --- |
| Capacity | The ward has 74 beds. Admissions must use an available bed. |
| Temperature validation | Values outside 34°C–42°C are rejected. Values below 35°C or above 41°C require confirmation. Fever is 38°C or above. |
| Correction history | One official reading per patient per day. Only today's reading can be corrected, and a reason is required. |
| Visit permissions | Only Doctors can record visits, and only after today's temperature has been recorded. |
| Discharge eligibility | Three consecutive fever-free days, including today, plus a Doctor visit today. |
| Two-step discharge | A Doctor approves discharge; an Admin completes it and frees the bed. |
| Mortality reporting | `deaths ÷ closed cases × 100`; active patients are excluded. Rates above 15% are flagged, as are samples with fewer than 20 closed cases. |

## 🧭 Application pages

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Dashboard | Role-specific overview of readings, visits, alerts, discharges, beds, and outcomes. |
| `/patients` | Patients | Search, filter, and inspect patients; Admins can register admissions. |
| `/temperatures` | Temperature tracking | Review pending and completed readings and correction history. |
| `/doctor` | Doctor visits & discharge | Review visits, fever-free streaks, and discharge eligibility. |
| `/admin` | Beds & discharge | View occupancy, register patients, and complete approved discharges. |
| `/reports` | Reports | Review mortality, recovery, and closed-case reporting. |

## 🛠️ Tech stack

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite
- Tailwind CSS and Radix UI
- Lucide React icons
- Vitest and Testing Library

## 🚀 Getting started

Prerequisites: Node.js 20+ and npm.

```sh
git clone <repository-url>
cd WardFlow
npm install
npm run dev
```

Open the local address shown by Vite. To create a production build:

```sh
npm run build
npm run preview
```

## 🧪 Testing

The project uses Vitest with Testing Library. Rule tests cover temperature validation, permissions, visits, discharge sequencing, bed allocation, and mortality calculations; routing is also covered.

```sh
npm run test
npm run lint
```

Useful development commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run preview` | Preview the production build. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run tests once. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run format` | Format files with Prettier. |

## 🗂️ Project structure

```text
src/
├── components/
│   ├── ui/                 # Reusable Radix-based UI primitives
│   └── wardflow/           # WardFlow shell, dialogs, reports, and guide
├── lib/wardflow/
│   ├── logic.ts            # Permission-checked pure workflow rules
│   ├── seed.ts             # Fictional deterministic demo data
│   └── store.tsx           # React state and LocalStorage persistence
├── routes/                 # TanStack Router file routes
└── test/                   # Vitest tests
```

## 💾 Data and persistence

WardFlow has no backend or external database. It loads fictional demo data, then persists changes in the current browser's LocalStorage. Data remains in that browser until site storage is cleared or **Reset demo data** is selected in the sidebar.

## 📚 In-app documentation

Select **Help** in the application header to open the **WardFlow Workflow Guide**. The modal is available from every main route and gives a concise guide to roles, the patient workflow, thresholds, discharge steps, reports, and prototype limitations.

## ⚠️ Limitations

WardFlow is a prototype for demonstration and product exploration. It uses fictional data, simulated role switching, browser-only storage, and no real authentication or backend. It is not intended for real patient records, clinical decisions, or production healthcare operations.

## 🤝 Development notes

Business rules are pure functions in [`src/lib/wardflow/logic.ts`](src/lib/wardflow/logic.ts). UI mutations go through `useWard().run`, which enforces role permissions at the action boundary. Routing uses TanStack Router file routes under [`src/routes`](src/routes).

This project is connected to [Lovable](https://lovable.dev). Keep pushed branches in a working state and avoid force-pushing or rewriting published Git history, because commits sync back to the Lovable editor.
