# School ERP — Comprehensive User Guide & Operations Manual

Welcome to the **School ERP Operations Manual**. This guide provides step-by-step operational instructions for institutional administrators, educators, parents, students, and operational staff.

---

## 📑 Table of Contents

1. [System Architecture & Role Hierarchy](#1-system-architecture--role-hierarchy)
2. [School Administrator Operations](#2-school-administrator-operations)
   - [Academic Setup (Classes, Sections, Rooms & Timetables)](#21-academic-setup)
   - [Move to New Session & Student Progression Workflow](#22-move-to-new-session--student-progression-workflow)
   - [Student Directory & Emergency/Medical Records](#23-student-directory--emergency-records)
   - [Faculty & Teacher Management](#24-faculty--teacher-management)
   - [Non-Teaching Staff & Access Governance](#25-non-teaching-staff--access-governance)
   - [Fee Management, Bulk Charges & Collections](#26-fee-management-bulk-charges--collections)
   - [Attendance & Consecutive Absence Concerns](#27-attendance--consecutive-absence-concerns)
   - [Examinations, Marks & Academic Insights](#28-examinations-marks--academic-insights)
   - [Transport Logistics & Vehicle Tracking](#29-transport-logistics--vehicle-tracking)
   - [Reception Desk & Admission Enquiries](#210-reception-desk--admission-enquiries)
3. [Teacher Portal Guide](#3-teacher-portal-guide)
4. [Parent Portal & Multi-Child Management](#4-parent-portal--multi-child-management)
5. [Student Portal Guide](#5-student-portal-guide)
6. [Operational Staff Guides (Accountant, Receptionist, Driver)](#6-operational-staff-guides)
7. [Super Administrator Guide](#7-super-administrator-guide)

---

## 1. System Architecture & Role Hierarchy

The platform implements strict tenant isolation using a tenant key (`school_id`) across all data stores. User personas include:

```text
Platform Super Admin (Global Tenant Governance)
  └── School Admin (Institutional Operations & Settings)
        ├── Teachers (Classroom, Attendance, Gradebooks)
        ├── Accountants / Cashiers (Fee Collections, Receipts)
        ├── Receptionists (Visitor Logs, Admission Enquiries)
        ├── Transport Drivers (Bus Manifests, Pickup/Drop Events)
        ├── Parents (Multi-Child Monitoring, Fee Dues, Leaves)
        └── Students (Timetable, Academic Results, Receipts)
```

---

## 2. School Administrator Operations

### 2.1 Academic Setup
Navigate to **Academics** from the sidebar to manage structural foundations:
- **Classes & Sections** (`/admin/academics/classes`): Create grade levels (e.g. Class 6 to 10), assign section divisions (A, B, C), map designated Classrooms/Labs, and appoint Class Teachers.
- **Classrooms & Labs** (`/admin/academics/rooms`): Track institutional physical spaces, capacities, and building wings.
- **Subjects** (`/admin/academics/subjects`): Define curriculum subjects and codes.
- **Timetable** (`/admin/academics/timetable`): Schedule weekly class periods with automated conflict checks.

---

### 2.2 Move to New Session & Student Progression Workflow
The **Move to New Session** engine automates annual student progression while preserving historical rosters and transcripts.

```text
Final Exams / Year End
  ↓
[Move to New Session] Action
  ↓
System calculates suggestions (using classes.next_class_id & status flags)
  ↓
[Review Students] Step (Filter exceptions, resolve pending rows)
  ↓
Preview Transition Breakdown (Verify promote, repeat, leavers, graduates)
  ↓
Confirm & Execute
  ↓
New academic-year enrollments created (Old enrollments remain in history)
```

#### Step-by-Step Transition Instructions:
1. Open **Settings → Academic Years & Sessions** (`/admin/settings`) or click **`[Move to New Session]`** in the Classes page header.
2. **Step 1 (Select Session)**: Choose the active source session (e.g., `2026-27`) and the target session (e.g., `2027-28`). Click **`Calculate Suggestions & Review Students →`**.
3. **Step 2 ([Review Students])**:
   - The system automatically assigns suggested transitions:
     - Normal active students $\rightarrow$ `Promote to Next Class` via `classes.next_class_id`.
     - Students tagged `repeat` $\rightarrow$ `Repeat Current Class`.
     - Students marked `left_school` or `transferred` $\rightarrow$ `No New Enrollment`.
     - Final year students (Class 10) $\rightarrow$ `Graduate (Alumni)`.
     - Incomplete records $\rightarrow$ `Pending Decision`.
   - Use the filter tabs: **`All`**, **`Ready to Promote`**, **`Repeat`**, **`Leaving / Transfer`**, **`Graduating`**, **`Pending Decision`**.
   - Admin can change individual student decisions directly using the dropdown on each row.
   - *Note:* If any student remains in `Pending Decision`, the transition cannot be finalized until resolved.
4. **Step 3 (Preview Transition)**: Inspect the consolidated breakdown:
   ```text
   2026-27 → 2027-28
   Promote               1,173
   Repeat                   21
   No New Enrollment        18
   Graduate                 34
   Pending                   0
   ```
5. **Step 4 (Confirm & Switch)**: Click **`Confirm & Move to New Session`**. Choose whether to switch the school's active current session to the new session immediately.
6. **Reversibility Safeguard**: The transition batch is recorded in the history table. While the target academic year remains in draft setup state (0 attendance records, 0 fee collections, 0 published exams), clicking **`[Reverse Transition]`** will safely revert all students back to their previous session state.

---

### 2.3 Student Directory & Emergency Records
Navigate to **People → Students** (`/admin/students`):
- **Directory**: Instant search by student name, registration number, or class filter.
- **Student Profile**: Shows complete student bio, emergency/medical alerts, current enrollment, and multi-year historical enrollments.
- **Emergency & Medical Information**: Blood group, severe allergies (e.g. peanut allergies), medical condition notes (e.g. asthma), and primary emergency contact details.
- **Parent Links**: Linked parent guardian profiles and sibling associations.

---

### 2.4 Faculty & Teacher Management
Navigate to **People → Teachers** (`/admin/teachers`):
- **Teacher Directory**: View active and inactive faculty with search and export.
- **Teacher Profile** (`/admin/teachers/[id]`):
  - Prominent **`[Edit Teacher]`** button to modify photo, personal info, phone, email, and department.
  - **Teaching Assignments**: View and manage subject and class allocations with **`[+ Add Assignment]`** and **`[Remove]`** controls.
  - **Salary History Preservation**: When updating salary, previous pay structures are versioned in `employee_salary_history` without altering historical payroll records.
  - **Password Reset**: Secure credential generation with one-click copy and temporary password options.

---

### 2.5 Non-Teaching Staff & Access Governance
Navigate to **People → Staff** (`/admin/staff`):
- Manage administrative and support staff: Accountants, Receptionists, Librarians, Caretakers, Transport Drivers, and Security Officers.
- Configure granular role permissions (`view_students`, `collect_fees`, `manage_transport`, etc.).

---

### 2.6 Fee Management, Bulk Charges & Collections
Navigate to **Finance → Student Fees** (`/admin/fees`):
- **Collections Dashboard**: View real-time daily fee collection totals with breakdown by payment method:
  - **UPI**
  - **Cash**
  - **Bank Transfer (NEFT/RTGS)**
  - **Cheque / DD**
  - Itemized Cashier / Accountant reconciliation.
- **Fee Structures & Versioning** (`/admin/fees/structures`): Update class-wide annual/monthly fee components. Changes automatically create version snapshots in `fee_structure_versions`.
- **One-Time Bulk Charges**: Apply one-time charges (e.g., science excursions, annual event fees) across a class or entire school with an interactive **Student Exclusion Checklist**. Cancellation is permitted only if 0 payments have been collected.
- **Fee Collection & 4-Up Receipt Printing**: Record student fee payments, apply discounts/fines, and generate printable 4-up receipts formatted for A4 quad-sheet receipt printers.

---

### 2.7 Attendance & Consecutive Absence Concerns
Navigate to **Attendance** (`/admin/attendance`):
- **Daily Marking & Registers**: View class-by-class attendance registers with percentages.
- **Attendance Concerns Intelligence**: The system flags students with consecutive absent working days ($\ge 3$ days = Watch, $\ge 5$ days = Concern, $\ge 10$ days = Critical). Approved leaves and official holidays are automatically excluded from consecutive absence counters.
- **Parent Follow-up Logging**: Click **`[Call Parent]`** or **`[+ Add Follow-up]`** on any flagged student to record parent communication details and schedule future check-ins.
- **Leave Requests** (`/admin/attendance/leaves`): Review, approve, or reject student leave requests submitted by parents or teachers.

---

### 2.8 Examinations, Marks & Academic Insights
Navigate to **Academics → Examinations & Results** (`/admin/exams` & `/admin/results`):
- Schedule term exams, unit tests, and board evaluations.
- **Academic Insights**: View normalized class toppers (rank 1, 2, 3) and subject-by-subject percentage averages.

---

### 2.9 Transport Logistics & Vehicle Tracking
Navigate to **Transport** (`/admin/transport`):
- Register school buses and vans with driver assignments and capacity tracking.
- Set up routes, bus stops, estimated pickup/drop timings, and assign students to stops.
- Monitor real-time student pickup/drop events logged by drivers.

---

### 2.10 Reception Desk & Admission Enquiries
Navigate to **Reception** (`/admin/reception`):
- Record front-office visitor logs.
- Track prospective admission enquiries through conversion stages (`new` $\rightarrow$ `contacted` $\rightarrow$ `form_submitted` $\rightarrow$ `interview_scheduled` $\rightarrow$ `admitted` / `rejected`).

---

## 3. Teacher Portal Guide
Logged-in Teachers (`/teacher`) can:
- Mark daily attendance for assigned classroom cohorts.
- Enter and update subject test scores and term exam marks.
- View their personalized teaching timetable and classroom assignments.
- Review historical monthly salary slips.

---

## 4. Parent Portal & Multi-Child Management
Logged-in Parents (`/parent`) can:
- **Switch Sibling Profiles**: Instantly toggle between children (e.g. Rahul in Class 8A and Riya in Class 5B) from the top profile bar.
- **Attendance & Calendar**: View real-time daily present/absent logs and school holidays.
- **Submit Leaves**: Apply for medical or family leave directly from the portal.
- **Fee Invoices & Dues**: Review breakdown of pending tuition fees and download past payment receipts.
- **Emergency & Medical Summary**: Review recorded medical alerts and verify emergency contact numbers.
- **Call School Helpline**: Click the direct **Call School** action to dial the school's emergency helpline.

---

## 5. Student Portal Guide
Logged-in Students (`/student`) can:
- View their daily period-by-period class timetable.
- Check published examination scores and report cards.
- View fee status and verified payment receipts.
- Review assigned school bus route and stop timings.

---

## 6. Operational Staff Guides

### Accountant / Cashier
- Access `/admin/fees` to record student payments, issue physical printed receipts, and generate daily cashier reconciliation reports.

### Receptionist
- Access `/admin/reception` to register campus visitors, log prospective admission enquiries, and schedule parent interview dates.

### Transport Driver
- Access `/driver` to view the assigned vehicle route manifest and mark students as **Picked Up**, **Dropped Off**, or **Not Riding**.

---

## 7. Super Administrator Guide
Platform Super Administrators (`/super-admin`) manage tenant onboarding, global compliance, school account suspensions, and platform-level audit logs.
