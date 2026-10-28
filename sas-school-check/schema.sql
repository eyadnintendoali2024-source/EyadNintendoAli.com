CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_login TEXT,
  password_changed_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS teacher_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  device_name TEXT NOT NULL,
  device_identifier TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  revoked INTEGER NOT NULL DEFAULT 0,
  revoked_at TEXT,
  last_used_at TEXT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE IF NOT EXISTS device_link_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  code_hash TEXT NOT NULL,
  created_by_admin INTEGER NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  revoked INTEGER NOT NULL DEFAULT 0,
  revoked_at TEXT,
  used_by_device TEXT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (created_by_admin) REFERENCES teachers(id)
);

CREATE TABLE IF NOT EXISTS passkeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  sign_count INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_used_at TEXT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  device_id INTEGER,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  distance_meters REAL,
  geofence_radius_meters REAL,
  geofence_verified INTEGER NOT NULL DEFAULT 0,
  location_lat REAL,
  location_lng REAL,
  source TEXT NOT NULL DEFAULT 'manual',
  note TEXT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (device_id) REFERENCES teacher_devices(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL,
  actor_id INTEGER,
  event TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  purpose TEXT NOT NULL,
  challenge TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  expires INTEGER NOT NULL,
  data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_device_link_codes_teacher_id ON device_link_codes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON attendance_records(teacher_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
