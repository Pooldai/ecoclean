
-- ECO CLEAN DATABASE SCHEMA
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Profiles Table (Users)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  "profilePictureUrl" TEXT,
  "createdAt" BIGINT NOT NULL
);

-- 2. Waste Reports Table
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  "citizenId" TEXT REFERENCES profiles(id),
  "citizenName" TEXT NOT NULL,
  "photoUrl" TEXT NOT NULL,
  location JSONB NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL,
  "assignedPickerId" TEXT REFERENCES profiles(id),
  "assignedPickerName" TEXT,
  "completionProofUrl" TEXT,
  "completedAt" BIGINT,
  "collectedWeight" NUMERIC,
  "needsReassignment" BOOLEAN DEFAULT FALSE
);

-- 3. Feedback Table
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  "reportId" TEXT REFERENCES reports(id),
  "pickerId" TEXT REFERENCES profiles(id),
  "userId" TEXT REFERENCES profiles(id),
  "userName" TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  "isCleaned" BOOLEAN NOT NULL,
  "createdAt" BIGINT NOT NULL
);

-- ENABLE RLS (Row Level Security) - For demo, we'll keep it simple
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ALLOW ALL ACCESS POLICY (For rapid MVP development)
CREATE POLICY "Public Read Access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON profiles FOR UPDATE USING (true);

CREATE POLICY "Public Read Access" ON reports FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON reports FOR UPDATE USING (true);

CREATE POLICY "Public Read Access" ON feedback FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON feedback FOR UPDATE USING (true);
