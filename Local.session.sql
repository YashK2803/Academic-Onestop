-- USERS table (students, teachers, admins)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','teacher','admin') NOT NULL,
  department VARCHAR(100),
  enrollmentNo VARCHAR(100),
  employeeId VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ATTENDANCE table
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present','Absent','On Leave') NOT NULL,
  course VARCHAR(100),
  markedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (markedBy) REFERENCES users(id)
);

-- GRADES table
CREATE TABLE grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  course VARCHAR(100) NOT NULL,
  semester VARCHAR(50) NOT NULL,
  grade VARCHAR(5) NOT NULL,
  gradedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (gradedBy) REFERENCES users(id)
);

-- LEAVE table
CREATE TABLE leave_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  reason VARCHAR(255) NOT NULL,
  type ENUM('Medical','Academic','Personal') NOT NULL,
  status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewedBy INT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (reviewedBy) REFERENCES users(id)
);

-- TIMETABLE table
CREATE TABLE timetables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classId VARCHAR(100) NOT NULL,
  day VARCHAR(20) NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  subject VARCHAR(100),
  teacher VARCHAR(100),
  room VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ASSIGNMENTS table
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  dueDate DATE NOT NULL,
  classId VARCHAR(100) NOT NULL,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- ASSIGNMENT SUBMISSIONS table
CREATE TABLE assignment_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignmentId INT NOT NULL,
  studentId INT NOT NULL,
  submission TEXT,
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade VARCHAR(5),
  feedback TEXT,
  FOREIGN KEY (assignmentId) REFERENCES assignments(id),
  FOREIGN KEY (studentId) REFERENCES users(id)
);

-- FINANCE table
CREATE TABLE finance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('Online','Cash','Cheque') NOT NULL,
  description VARCHAR(255),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  receiptUrl VARCHAR(255),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- MESSAGES table (communication)
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  senderId INT NOT NULL,
  receiverId INT NOT NULL,
  content TEXT NOT NULL,
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(id),
  FOREIGN KEY (receiverId) REFERENCES users(id)
);

-- CALENDAR EVENTS table
CREATE TABLE calendar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  eventDate DATE NOT NULL,
  description TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- FEEDBACK table
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  courseId VARCHAR(100),
  instructorId INT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (instructorId) REFERENCES users(id)
);

-- RESOURCE HUB table
CREATE TABLE resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fileUrl VARCHAR(255) NOT NULL,
  courseId VARCHAR(100),
  uploadedBy INT,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploadedBy) REFERENCES users(id)
);

-- AI ANALYTICS table (for predictions/logs)
CREATE TABLE ai_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  prediction VARCHAR(255),
  modelVersion VARCHAR(50),
  details TEXT,
  predictionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id)
);