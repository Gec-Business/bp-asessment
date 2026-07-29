# GEC Strategic Maturity Assessment Mini-Site

This is a Next.js Full Stack application for the GEC Strategic Maturity Assessment.

## Prerequisites

- Node.js 18+ (Installed)
- npm (Comes with Node.js)

## Setup Instructions

1.  **Navigate to the project directory:**
    ```bash
    cd gec-assessment-site
    ```

2.  **Install Dependencies:**
    If not already done:
    ```bash
    npm install
    ```

3.  **Initialize Database (SQLite):**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

5.  **Open Browser:**
    Go to [http://localhost:3000](http://localhost:3000)

## Features

- **Landing Page:** Interactive "Evolution Path" infographic.
- **Assessment:** Multi-step wizard with 12 questions.
- **Lead Generation:** Form to capture user details.
- **Results:** Dynamic phase calculation and PDF report generation.
- **Admin Panel:** Dashboard to manage questions and leads (visit `/cms` - password: `gec_admin_2024`).

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **PDF:** @react-pdf/renderer
- **Database:** SQLite (via Prisma)

## Troubleshooting

- If `npx prisma` fails, ensure you have run `npm install` successfully.
- If PDF generation fails, check the console for font loading errors.
