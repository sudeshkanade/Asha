# 🏥 Rural Health Tracker | Master Documentation

## 1. System Overview
The **Rural Health Tracker** is a production-grade, offline-first Progressive Web App (PWA) designed for ASHA and ANM workers in India. It enables accurate clinical documentation, maternal/child health tracking, and automated government reporting (Goshwara/MPR).

---

## 2. Technical Architecture
### 📂 Project Structure
- **/src/screens**: Contains all UI modules (Dashboard, Goshwara, Registration, etc.).
- **/src/database**: Handles the storage engine (`storage.js`) and SQLite schema.
- **/src/utils**: Contains the clinical "brains" (Vaccination logic, Reporting math).
- **/src/constants**: Global design tokens (Slate & Emerald theme).

### 💾 Data Persistence
- **Storage Engine**: Uses `AsyncStorage` (web) and `SQLite` (native) fallback.
- **Conflict Resolution**: Uses a "Last-Write-Wins" vector clock based on the `lastUpdatedAt` timestamp.
- **Sync Queue**: All offline entries are queued with a `pending` status for background synchronization.

---

## 3. Clinical Logic & Compliance
### 💉 Vaccination Schedule (NHM India)
The system tracks the full UIP (Universal Immunization Programme) schedule:
- **Birth**: BCG, OPV-0, HepB-0
- **6/10/14 Weeks**: Pentavalent 1/2/3, OPV 1/2/3, fIPV 1/2, PCV 1/2
- **9-12 Months**: MR 1st Dose, Vitamin A, PCV Booster
- **16-24 Months**: MR 2nd Dose, DPT Booster 1, OPV Booster

### 📊 Goshwara Reporting
Automated aggregation of monthly abstracts:
- **Demographics**: Real-time bucketing by age (0-12m, 13-24m, 5-6y, etc.) and gender.
- **Maternal Health**: Tracking New ANC, Early Registration (<12 weeks), and High-Risk identification.
- **Child Health**: Calculation of "Fully Immunized" status based on completion of BCG + Penta3 + MR1 + OPV3.

---

## 4. Progressive Web App (PWA) Features
### 🚀 Offline Capabilities
- **Service Worker (`sw.js`)**: Caches all React/Babel/Font assets for 100% offline access.
- **Background Sync**: Automatically uploads pending records when the device detects a stable network.
- **Periodic Sync**: Refreshes the daily "Due List" in the background every morning.

### 📱 OS Integration
- **Shortcuts**: Long-press the icon to jump to Goshwara or New Registration.
- **Maskable Icons**: Optimized for Android and iOS launchers.
- **Deep Linking**: Supports `web+health://` links from other apps.

---

## 5. Deployment & Maintenance
### ⬆️ Deployment to GitHub Pages
1. Ensure `index.html` is pointing to `/src/main.jsx`.
2. Delete `sw.js` if you need to force a cache refresh for users.
3. Push changes to the `main` branch.

### 🛠️ Local Development
Run the following commands to start the professional dev server:
```powershell
npm install
npm run dev
```

---

## 6. Role-Based Access Control (RBAC)
- **ASHA Worker**: Access to Village Register, Family Registration, and Daily Task Lists.
- **ANM Supervisor**: Full access to ASHA modules + Goshwara Abstracts, MPR Reports, and Admin Rate Settings.
- **Admin**: Full system access, including workforce hierarchy management.
