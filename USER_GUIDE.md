# 📖 Rural Health Tracker | Visual User Guide

This guide provides step-by-step instructions for ASHA and ANM workers to use the platform effectively in the field.

---

## Step 1: Accessing the Dashboard
When you first open the app, you will land on the **Clinical Dashboard**. This is your command center for the village.

![Clinical Dashboard](file:///C:/Users/SC_Bu/.gemini/antigravity/brain/f724ea52-28b9-40d1-997d-24003de88e57/media__1778131333791.jpg)

### Key Features:
- **Active ANC Card**: Shows the total number of pregnant women currently under your care.
- **High Risk Card (Amber)**: Highlights patients who need immediate attention (Severe Anemia, High BP).
- **Quick Actions**: Buttons for registering a new family or generating reports.

---

## Step 2: Registering a New Member
To add a family member, click the **"Register New Family"** button. 

1. Enter the **Member's Name** and **Date of Birth**.
2. Select the **Clinical Condition** (General, ANC, or Child).
3. If they are a child, the system will automatically calculate their **UIP Vaccination Schedule**.

---

## Step 3: Generating the Goshwara Report
At the end of every month, ANMs must generate the Goshwara abstract for the Sub-Centre.

![Goshwara Reporting](file:///C:/Users/SC_Bu/.gemini/antigravity/brain/f724ea52-28b9-40d1-997d-24003de88e57/media__1777775138018.jpg)

### Instructions:
1. Navigate to the **Reports** tab.
2. Review the **Maternal Health** and **Immunization** tables.
3. Click **"Finalize & Submit"**. This will lock the data for the month to ensure government reporting accuracy.

---

## Step 4: Updating the App via GitHub
As a supervisor, you can update the system by uploading new files to your GitHub repository.

![GitHub Deployment](file:///C:/Users/SC_Bu/.gemini/antigravity/brain/f724ea52-28b9-40d1-997d-24003de88e57/media__1778135805541.jpg)

### Steps:
1. Log in to **GitHub**.
2. Navigate to your **Asha** repository.
3. Upload the new `index.html` and `src/` files.
4. The changes will go live on your public URL within 2 minutes.

---

## Step 5: Offline Use
If you are in a village with **no internet**, the app will continue to work normally. 
- You can still register members and save health visits.
- Once you return to a 4G/Wi-Fi area, the **Service Worker** will automatically sync your data to the central server.
