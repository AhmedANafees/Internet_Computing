# Course Registration Dashboard

A full-stack web application designed for **Wilfrid Laurier University** students and administrators to manage the academic registration process efficiently. This project is developed for **CP476 - Internet Computing**.

---

## Project Overview
The Course Registration Dashboard centralizes course planning, searching, and enrollment into a single interface. It replaces manual comparisons of multiple pages with an integrated workflow including conflict detection and administrative management tools.

### Key Features
* **Catalog Search & Filtering**: Find courses by code, title, subject, and level.
* **Visual Timetable**: Weekly grid view of planned and registered courses with conflict highlighting.
* **Admin Management**: Dedicated tools for administrators to manage courses, sections, and term data.
* **Intelligent Logic**: Automatic validation of prerequisites and co-requisites during checkout.

---

## Technical Stack
* **Frontend**: React
* **Backend**: Server-side processing for registration logic
* **Database**: Relational Database (SQL)
* **Environment**: Integrated with GitHub Projects and CI/CD pipelines

---

## 👥 The Team
| Name | Primary Role |
| :--- | :--- |
| **Nick Kunde-Lenny** | Scrum Master, Back-end |
| **Matthew Kondratowicz** | Back-end (controllers & routing) |
| **Ahmed Nafees** | Front-end, Repository & Integration |
| **Alex Near** | Front-end |
| **Ryan Chisholm** | Front-end |
| **Naram Yashooa** | Front-end |
| **Ayush Gogne** | Front-end |
| **Isabel Katai** | Front-end |
| **Manha Malik** | Front-end |
---

## Project Cadence
* **Sprint Cycle**: Two-week sprints aligned with milestone deadlines.
* **Weekly Sync**: Mondays (60 min) in-person for planning and blockers.
* **Async Standup**: Wednesdays by 9:00 PM via Discord `#standup` channel.
* **Documentation**: All meeting minutes and decisions recorded in the GitHub Wiki.

---

## Definition of Done
A task is marked as **Done** only when:
1. All acceptance criteria from the User Story are met and verified by the QA Lead.
2. Code is reviewed by at least one other team member via Pull Request.
3. Pull Request is merged to `main` with no failing CI checks.
4. Logic is supported by unit/integration tests and relevant documentation.
5. The feature is demoed during a standup or within the PR walkthrough.

---

## Setup & Installation

This repository is a monorepo with two runnable apps: the REST API in `backend/` and the React client in `frontend/`. Run each in its own terminal.

**Prerequisites:** Node.js 18 or newer and npm, plus a local MySQL 8 server.

### Back-end (`backend/`)
```bash
cd backend
npm install
cp .env.example .env          # then set DB_USER and DB_PASSWORD for your local MySQL
npm run db:init               # create the database and tables
npm run db:seed               # load sample data and test logins
npm run dev                   # API on http://localhost:3000
```
Seeded logins: `teststudent@example.edu` / `Password123!` (student) and `admin@example.edu` / `Admin123!` (admin). The full API reference is in `backend/BACKEND.md`. Each teammate creates their own `backend/.env`; it is gitignored and should never be shared.

### Front-end (`frontend/`)
```bash
cd frontend
npm install
npm run dev                   # app on http://localhost:5173
```
The client reads its API base URL from `VITE_API_BASE_URL` (default `http://localhost:3001`). Point it at the running back-end by creating `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:3000
```
The back-end already allows the Vite origin `http://localhost:5173` through CORS.

---

## Team Contributions (Milestone 2)
A brief summary of what each member worked on this milestone:

* **Nick Kunde-Lenny**: Back-end REST API (Node, Express, MySQL), database schema, authentication and sessions, and the registration and conflict logic.
* **Matthew Kondratowicz**: Back-end controllers and routing.
* **Ahmed Nafees**: Repository structure and integration, plus front-end work on the timetable, dashboard, sidebar, course registration, and wiring the front-end to the backend APIs.
* **Alex Near**: Front-end login and course registration views.
* **Ryan Chisholm**: Front-end dashboard and timetable pages.
* **Naram Yashooa**: Front-end course summary card component.
* **Ayush Gogne, Isabel Katai, and Manha Malik**: Front-end UI and UX design.
