-- Comprehensive Database Schema for Rural Health APK

-- User Profiles Table
CREATE TABLE IF NOT EXISTS User_Profiles (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    designation TEXT,
    assigned_village TEXT NOT NULL,
    last_sync_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Families Table
CREATE TABLE IF NOT EXISTS Families (
    family_id TEXT PRIMARY KEY,
    village_name TEXT NOT NULL,
    house_number TEXT,
    religion_caste TEXT,
    bpl_status BOOLEAN,
    ration_card_no TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'pending'
);

-- Members Table
CREATE TABLE IF NOT EXISTS Members (
    member_id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT,
    dob DATE,
    age INTEGER,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    aadhaar_no TEXT CHECK(length(aadhaar_no) = 12),
    abha_id TEXT,
    is_head BOOLEAN DEFAULT 0,
    sync_status TEXT DEFAULT 'pending',
    FOREIGN KEY (family_id) REFERENCES Families(family_id) ON DELETE CASCADE
);

-- Service Tracker Table (Unified for all health tracking)
CREATE TABLE IF NOT EXISTS Service_Tracker (
    service_id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    service_type TEXT NOT NULL, -- 'ANC', 'PNC', 'HBNC', 'HBYC', 'NCD', 'VACCINATION', 'DISEASE'
    
    -- Maternal Health (ANC/PNC)
    anc_number INTEGER, -- 1, 2, 3, 4
    pnc_visit_number INTEGER,
    edd DATE,
    high_risk_flag BOOLEAN DEFAULT 0,
    
    -- Child Health (HBNC/HBYC)
    visit_day_month INTEGER, -- e.g., 3 (day), 3 (month)
    is_completed BOOLEAN DEFAULT 0,
    
    -- Disease & NCD
    malaria_bs_result TEXT,
    sputum_result TEXT, -- TB/Leprosy
    bp_systolic INTEGER,
    bp_diastolic INTEGER,
    blood_sugar REAL,
    ncd_type TEXT, -- 'Diabetes', 'Cancer', 'Palliative'
    
    -- Service Delivery Metadata
    scheduled_date DATE,
    actual_date DATE,
    gps_latitude REAL,
    gps_longitude REAL,
    remarks TEXT,
    
    sync_status TEXT DEFAULT 'pending',
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE
);

-- Event Logging Table
CREATE TABLE IF NOT EXISTS Event_Logs (
    event_id TEXT PRIMARY KEY,
    village_name TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'Kishori Mela', 'ANC Melava', 'PNC Melava', 'Sabha'
    event_date DATE NOT NULL,
    topic TEXT,
    attendance_count INTEGER,
    gps_latitude REAL,
    gps_longitude REAL,
    sync_status TEXT DEFAULT 'pending'
);

-- Sync Queue Table
CREATE TABLE IF NOT EXISTS Sync_Queue (
    queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    data_payload TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
