# School ERP — Next-Gen Multi-Tenant Institutional Management System

An enterprise-grade, multi-tenant School Enterprise Resource Planning (ERP) platform built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**. Designed for high performance, intuitive UX, complete operational security, and strict tenant isolation.

---

## 🌟 Key Highlights & System Capabilities

- 🏢 **Strict Multi-Tenancy**: Complete data partitioning via tenant isolation keys (`school_id`), preventing cross-institutional data leakage.
- 👥 **Multi-Persona Architecture**: Dedicated, tailored workspaces for **Super Admin**, **School Admin**, **Teachers**, **Students**, **Parents**, and **Non-Teaching Staff** (Accountants, Receptionists, Librarians, Transport Drivers).
- 🎓 **Move to New Session & Progression Engine**: Full academic cohort transition workflow with automatic suggestion calculations (`classes.next_class_id`), an interactive **`[Review Students]`** exception resolution table, pre-confirmation breakdown preview, and setup-phase reversibility safeguards.
- 💳 **Comprehensive Fee & Collection Management**: Class-wide fee structures with version history (`fee_structure_versions`), one-time bulk charges with student exclusion checklists (`bulk_charge_batches`), daily payment method breakdowns (UPI, Cash, Bank, Cheque), cashier reconciliation, and printable 4-up fee receipts.
- 👨‍👩‍👧‍👦 **Multi-Child Parent Portal**: Unified parent dashboard to monitor multiple siblings, submit leaves, review attendance and fee invoices, view medical/emergency alerts, and connect instantly via the **Call School** helpline.
- 📊 **Academic & Attendance Insights**: Normalized class toppers, subject performance averages, consecutive absence alerts ($\ge 3$, $\ge 5$, $\ge 10$ days), and parent communication follow-up tracking.
- 🚌 **Transport Logistics & Safety**: Real-time vehicle manifests, route & stop assignments, and driver pickup/drop recording with instant status updates.
- 🔒 **Enterprise Security & Compliance**: Role-based access control (RBAC), hierarchical password resets, login audit trails, rate limiting, and regulated account/school deletion workflows.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 15.5+ (App Router, Server Components & Client Hydration) |
| **Language** | TypeScript 5 (Strict Mode, 100% Type-Safe) |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Custom Accessible Component Primitives |
| **State & Persistence** | React Context (`AuthContext`), Storage Service with SSR Fallback, Seed Database |
| **Build & Tooling** | PostCSS, ESLint, npm |

---

## 📂 Project Structure

```text
├── app/                               # Next.js App Router Routes
│   ├── (auth)/login/                  # Universal Authentication & Role Switcher
│   ├── admin/                         # School Admin Management Portal
│   │   ├── academics/                 # Classes, Sections, Classrooms, Subjects, Timetable
│   │   ├── attendance/                # Daily Marking, Registers, Leaves & Concerns
│   │   ├── exams/                     # Exam Schedules, Grading & Results
│   │   ├── fees/                      # Invoices, Receipts, Collections & Bulk Charges
│   │   ├── notices/                   # School-wide & Class-specific Announcements
│   │   ├── payroll/                   # Staff Salary Management & Payment Records
│   │   ├── reception/                 # Visitor Logs & Admission Enquiries
│   │   ├── results/                   # Academic Scorecards & Topper Insights
│   │   ├── security/logs/             # Authentication & System Audit Logs
│   │   ├── settings/                  # School Branding, Sessions & Move to New Session
│   │   ├── staff/                     # Staff Directory, Roles & Credentials
│   │   ├── students/                  # Student Directory, Profiles & Enrollment History
│   │   ├── teachers/                  # Teacher Profiles, Subject Assignments & Salaries
│   │   └── transport/                 # Vehicles, Routes, Stops & Tracking
│   ├── driver/                        # Transport Driver Portal (Pickup/Drop Manifests)
│   ├── parent/                        # Parent Portal (Multi-Child Switcher & Details)
│   ├── staff/                         # Non-Teaching Staff Workspaces
│   ├── student/                       # Student Portal (Timetable, Results & Fees)
│   ├── super-admin/                   # Platform Super Admin (Tenants & System Settings)
│   └── teacher/                       # Teacher Portal (Attendance, Classes & Exams)
├── components/                        # Reusable Component Library
│   ├── academic/                      # Session Transition Modal & Progression Wizard
│   ├── auth/                          # Password Reset & Auth Protection Modals
│   ├── receipt/                       # Printable 4-Up Fee Receipts & Slips
│   └── ui/                            # Buttons, Modals, Badges, Tables, Skeletons, Inputs
├── lib/
│   ├── context/                       # AuthContext & Session Management
│   ├── services/                      # API Layer, Storage Service & Seed Data
│   ├── types/                         # Centralized TypeScript Type Definitions
│   └── utils/                         # Security, Formatters, CN, Validation & CSV Exports
└── public/                            # Static Assets, Icons & Media
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.18.0 or higher (v20+ recommended)
- **npm**: v9+ (or **pnpm** / **yarn**)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repo-url>
cd "SChool erm"
npm install
```

### 2. Environment Configuration
Copy the sample environment variables:
```bash
cp .env.example .env.local
```

### 3. Development Server
Run the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Execution
Create an optimized production build and launch the production server:
```bash
npm run build
npm run start
```

---

## 🔐 Default Login Credentials (Demo Accounts)

You can sign in directly from the `/login` page using any of the pre-configured institutional personas:

| Role | Email | Password | Access / Primary Functions |
|---|---|---|---|
| **Super Admin** | `superadmin@platform.edu` | `Super@123` | Multi-school tenant management, suspensions, global audit logs |
| **School Admin** | `admin@delhipublic.edu.in` | `Admin@123` | Complete institutional governance, sessions, fees, faculty, students |
| **Teacher** | `rajesh.teacher@delhipublic.edu.in` | `Teacher@123` | Class attendance, subject gradebooks, timetable, assigned cohorts |
| **Parent** | `rajesh.kumar@example.com` | `Parent@123` | Multi-sibling dashboard (Rahul & Riya), fee payment, leaves, call school |
| **Student** | `rahul.student@delhipublic.edu.in` | `Student@123` | Timetable, examination results, fee receipts, transport schedule |
| **Accountant** | `accountant@delhipublic.edu.in` | `Staff@123` | Fee collections, cashier ledger, receipt printing, payment reports |
| **Receptionist** | `receptionist@delhipublic.edu.in` | `Staff@123` | Visitor logs, prospective student admission enquiries, follow-ups |
| **Driver** | `amit.driver@delhipublic.edu.in` | `Staff@123` | Route 4 manifest, student pickup/drop attendance events |

---

## 📘 Comprehensive Documentation

For a detailed step-by-step walkthrough of all institutional workflows, refer to the [User Guide](USER_GUIDE.md).

---

## User Guide: 120 Common Questions

This quick reference matches the current web build. Routes and menu names are included so users can find each workflow. A stated limitation means that the feature is not yet a complete production workflow.

### Access and Navigation

1. **How do I open the app?** Open the deployed URL, or run `npm run dev` and open `http://localhost:3000`.
2. **Where do I sign in?** Open `/login`.
3. **Where is the admin dashboard?** Open `/admin`.
4. **Why do users see different menus?** Menus are tailored to each active role.
5. **Where is the mobile menu?** Use the bottom navigation or menu button on a narrow screen.
6. **Where are students?** Open **Students**, `/admin/students`.
7. **Where are teachers?** Open **Teachers**, `/admin/teachers`.
8. **Where is staff management?** Open `/admin/staff`.
9. **Where is reception?** Open `/admin/reception`.
10. **Where are classes?** Open `/admin/academics/classes`.
11. **Where are rooms and labs?** Open `/admin/academics/rooms`.
12. **Where are subjects?** Open `/admin/academics/subjects`.
13. **Where is the timetable?** Open `/admin/academics/timetable`.
14. **Where are holidays?** Open `/admin/academics/holidays`.
15. **Where are notices?** Open `/admin/notices`.
16. **Where is transport?** Open `/admin/transport`.
17. **Where is payroll?** Open `/admin/payroll`.
18. **Where are school settings?** Open `/admin/settings`.
19. **Where are security logs?** Super Admins open `/super-admin/security/logs`.
20. **Where are student fees?** Open `/admin/fees`.

### Roles and Permissions

21. **What can a School Admin do?** Manage school setup, people, academics, finance, attendance, exams, notices, transport, payroll, and governance.
22. **What can a Super Admin do?** Manage platform schools, users, access requests, suspensions, settings, and global security logs.
23. **What can a teacher do?** Manage assigned attendance and marks, classes, timetable, leave, and salary statements.
24. **What can a student do?** View classes, timetable, transport, published results, fees, and profile data.
25. **What can a parent do?** View linked children, attendance, fees, leaves, alerts, and school contact details.
26. **What can a driver do?** View the route manifest and record pickup, drop-off, or not-riding events.
27. **What can an accountant do?** Use permitted fee collection, receipt, reconciliation, and finance workflows.
28. **What can a receptionist do?** Use permitted visitor and admission-enquiry workflows.
29. **Why can staff see the portal but not fees?** Fee access requires permissions such as `view_fees` or `record_student_payment`.
30. **Who grants staff permissions?** A School Admin from staff management or access-request approval.
31. **What does `view_fees` allow?** Viewing fee invoices.
32. **What does `record_student_payment` allow?** Recording student fee payments.
33. **Can teachers manage fees?** Fee administration belongs to School Admins and authorized finance staff.
34. **Can parents edit student records?** No. Parents can view linked data and submit supported requests.
35. **What is tenant isolation?** Records are separated by `school_id` and protected by row-level security policies.
36. **Why is a page empty?** Check the active school, active membership, academic year, and whether data is configured.
37. **What should I do after failed login?** Check credentials and account status; avoid repeated rapid attempts.
38. **Can an administrator reset passwords?** Yes, through the authorized user or staff security action.
39. **Are login events logged?** The system models successful, failed, OAuth, rate-limited, and password-reset events.
40. **Can one user access multiple schools?** Yes, when the user has an active membership in each school.

### Students and Enrolment

41. **How do I find a student?** Open `/admin/students` and search by name or registration number.
42. **Can I search by registration number?** Yes.
43. **Can I filter by class?** Yes, use the available class filter.
44. **How do I open a student record?** Select the student in the directory.
45. **What does the profile show?** Identity, enrollment, parent links, emergency, medical, and historical enrollment information where recorded.
46. **How do I add a student?** Use the create or register action on `/admin/students`.
47. **What is needed for registration?** Student identity, registration, class, section, guardian, emergency, and medical information.
48. **How do I edit a student?** Open the profile and choose the authorized edit action.
49. **How do I assign a class?** Edit enrollment and select year, class, section, roll number, and status.
50. **What is enrollment history?** It preserves earlier academic-year and class placements.
51. **How do I link a parent?** Add the guardian relationship from the student or parent-link workflow.
52. **Can a parent have several children?** Yes, the parent portal supports child switching.
53. **How do I record an allergy?** Add it to the student's medical information.
54. **How do I record an emergency contact?** Add it to emergency information.
55. **Can I export students?** Use the export action where it appears and where your role permits it.
56. **How do I record a student leaving?** Update the student or enrollment status and preserve history.
57. **Should old students be deleted?** Preserve academic, attendance, and financial history unless an approved retention process says otherwise.
58. **How do I move students to a new session?** Use **Move to New Session** in Settings or class management.
59. **What does session transition review?** Promotion, repetition, leaving, transfer, graduation, and unresolved decisions.
60. **Can I change one transition decision?** Yes, during review before confirmation.

### Teachers, Staff, and Payroll

61. **How do I find a teacher?** Open `/admin/teachers` and use search or filters.
62. **How do I open a teacher profile?** Select the teacher in the directory.
63. **How do I edit teacher details?** Open the profile and click **Edit Teacher**.
64. **Which teacher fields can be edited?** Supported fields include photo, personal details, phone, email, and department.
65. **How do I assign a subject?** Use **Add Assignment** on the teacher profile and choose class, section, subject, and year.
66. **How do I remove an assignment?** Use **Remove** beside the assignment.
67. **How do I increase a teacher's pay?** Open the teacher profile, use salary management, enter the new amount and effective date, and save.
68. **Are old salaries overwritten?** The intended workflow versions salary history in `employee_salary_history`.
69. **Where can teachers view salary statements?** Open `/teacher/payments`.
70. **Where is employee payroll?** Open `/admin/payroll`.
71. **Can accountants record payroll?** Only with the required role and permissions.
72. **How do I add staff?** Use the create-staff action on `/admin/staff`.
73. **Which staff types exist?** Accountant, receptionist, office staff, caretaker, driver, security, librarian, and other.
74. **How do I disable staff access?** Revoke permissions or change staff status, subject to authorization.
75. **How do I reset staff access?** Use the authorized password-reset action.

### Fees and Payments

76. **Where are invoices?** Open `/admin/fees` and select **Billing Invoices**.
77. **How do I create a fee structure?** Open `/admin/fees/structures`, click **Create Fee Structure**, enter name, amount, frequency, and due day, then save.
78. **Which fee frequencies exist?** Monthly, quarterly, annually, and one-time.
79. **How do I increase a class fee after a date?** In `/admin/fees`, select **Fee Structures & History**, click **Update Class Fee**, choose the structure and class, enter amount and **Effective From**, preview, and apply.
80. **Does this apply to all sections?** The current form labels the selected class as **All Sections**.
81. **Can I increase recurring fees for the whole school?** Not through the current recurring-fee form; whole-school targeting currently exists for one-time charges.
82. **Are past invoices changed?** The interface intends to leave historical invoices unchanged.
83. **Does the demo apply future dates automatically to new invoices?** Not completely; dated invoice generation is not fully connected to fee versions.
84. **Why is Fee Structures empty?** No structure exists for the active school, or the school ID does not match the record.
85. **What should I do when it is empty?** Open `/admin/fees/structures` and create a structure for the active school.
86. **Why is Update Class Fee disabled?** Select a structure and class and enter an amount greater than zero.
87. **What is a fee version?** A historical amount with effective dates, reason, creator, and timestamp.
88. **Can I apply a discount?** Yes, where the payment form provides discount fields.
89. **Can an invoice include a fine?** Yes, invoice records support a fine or late-fee amount.
90. **How do I collect a payment?** Find an unpaid invoice, click **Collect**, enter details, and submit.
91. **Which payment methods exist?** Cash, UPI, bank, cheque, and other.
92. **What is stored with payment?** Invoice, student, amount, method, date, reference, receiver, notes, and creation time.
93. **Where are daily collections?** Select **Daily Collections & Reports** inside `/admin/fees`.
94. **Can collections be filtered by method?** Yes.
95. **Can collections be filtered by cashier?** The collection service supports cashier filtering where exposed by the view.
96. **Can I export collections?** Use **Export CSV** when transactions exist.
97. **Where are receipts?** Select **Payment Receipts (1/4 A4)** inside `/admin/fees`.
98. **Can I print one receipt?** Yes, open it and use the print action.
99. **Can I print multiple receipts?** Yes, select receipts for the 4-up print action.
100. **What is a bulk charge?** A one-time charge mapped to multiple students.
101. **Can it target a class?** Yes, choose **Specific Class (All Sections)**.
102. **Can it target the school?** Yes, choose **Entire School** in the one-time bulk-charge form.
103. **Can students be excluded?** Yes, use the exclusion checklist before creation.
104. **Can a batch be cancelled?** Active batches can be cancelled; unpaid charges are intended to be cancelled.
105. **Recurring fee or bulk charge?** A recurring fee is a billing structure; a bulk charge is a single group charge.

### Attendance, Academics, Transport, and Privacy

106. **Where is attendance?** Admins use `/admin/attendance`; teachers use `/teacher/attendance`.
107. **Where are leave requests?** Admins use `/admin/attendance/leaves`.
108. **Where are exams scheduled?** Admins use `/admin/exams`; teachers enter marks in `/teacher/exams`.
109. **Where are results?** Students use `/student/results`; admins use `/admin/results`.
110. **Where are notices published?** Open `/admin/notices`.
111. **Where are vehicles and routes?** Open `/admin/transport`.
112. **Where does a driver see the manifest?** Open `/driver`.
113. **How does a driver record an event?** Select a student and record pickup, drop-off, or not riding.
114. **Where are visitors recorded?** Open `/admin/reception`.
115. **How are admission enquiries tracked?** Create an enquiry, update its stage, and record follow-up details.
116. **Where are academic years managed?** Open `/admin/settings`.
117. **How does a user request deletion?** Sign in and open `/account/delete`; public information is at `/account-deletion`.
118. **Where are deletion requests reviewed?** Admins open `/admin/account-requests`.
119. **Why do I see demo data?** The client API includes seeded data and storage fallback; confirm the active school ID and production integration.
120. **Where are migrations?** In `supabase/migrations`; seed data is in `supabase/seed.sql`.

## 🛡️ License & Compliance

Distributed under institutional proprietary licensing. All rights reserved. Designed with data privacy safeguards adhering to education governance standards.
