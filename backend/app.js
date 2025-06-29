require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');
const cookieParser = require('cookie-parser');

const multer = require('multer');


// Set up storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // create this folder if it doesn't exist
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// Route imports

const db = require('./config/db');
// const resourceHubRoutes = require('./routes/resourceHubRoutes');
// const aiAnalyticsRoutes = require('./routes/aiAnalyticsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser()); // Add cookie parser for auth tokens

// Serve static files (CSS, JS, images) from frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Set EJS as the view engine and set views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Authentication middleware for protected routes
const authMiddleware = require('./middleware/authMiddleware');

// Role-based middleware
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/auth/login');
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('error', { 
        user: req.user,
        error: { message: 'Access forbidden: insufficient permissions' }
      });
    }
    next();
  };
};

// Web routes (for rendering EJS views)
app.get('/', (req, res) => {
  res.render('auth/login', { user: null, error: null });
});

// Auth routes
app.get('/auth/login', (req, res) => {
  res.render('auth/login', { user: null, error: null });
});

app.get('/auth/register', (req, res) => {
  res.render('auth/register', { user: null, error: null });
});



// Student routes
app.get('/student/dashboard', authMiddleware, roleMiddleware(['student']), (req, res) => {
  res.render('student/dashboard', { user: req.user });
});

app.get('/student/attendance', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const [attendance] = await db.query(
      `SELECT * FROM attendance WHERE studentId = ? ORDER BY date DESC`,
      [req.user.id]
    );

    // Convert `date` to JS Date object if needed (some DB drivers return as string)
    const formatted = attendance.map(a => ({
      ...a,
      date: new Date(a.date)
    }));

    res.render('student/attendance', {
      user: req.user,
      attendance: formatted
    });

  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.render('student/attendance', {
      user: req.user,
      attendance: [],
      error: 'Failed to load attendance records.'
    });
  }
});


app.get('/student/grades', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const [grades] = await db.query(
      `SELECT * FROM grades WHERE studentId = ? ORDER BY semester DESC, course ASC`,
      [req.user.id]
    );

    res.render('student/grades', {
      user: req.user,
      grades: grades // send the fetched grades to the EJS
    });

  } catch (err) {
    console.error('Error fetching grades:', err);
    res.render('student/grades', {
      user: req.user,
      grades: [], // if there's an error, render with an empty array
      error: 'Failed to load grades.'
    });
  }
});

// Show Leave Applications for Student
app.get('/student/leave', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const [leaves] = await db.query(`
      SELECT * FROM leave_applications WHERE userId = ? ORDER BY appliedAt DESC
    `, [req.user.id]);

    // Format the dates before sending to the view
    leaves.forEach(leave => {
      leave.from = new Date(leave.startDate);  // ✅ correct field
      leave.to = new Date(leave.endDate);      // ✅ correct field
    });
    

    res.render('student/leave', { 
      user: req.user, 
      leaves: leaves 
    });

  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.render('student/leave', { 
      user: req.user, 
      leaves: [], 
      error: 'Failed to load leave applications.' 
    });
  }
});

// Render the Apply Leave Form
app.get('/student/leave/apply', authMiddleware, roleMiddleware(['student']), (req, res) => {
  res.render('student/ApplyLeave', { user: req.user });
});


// Apply for Leave (POST request)
app.post('/student/leave/apply', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { from, to, type, reason } = req.body;

  try {
    // Ensure dates are formatted to 'YYYY-MM-DD'
    const formattedFrom = new Date(from).toISOString().split('T')[0];  // 'YYYY-MM-DD'
    const formattedTo = new Date(to).toISOString().split('T')[0];      // 'YYYY-MM-DD'

    // Insert the leave application into the database
    await db.query(`
      INSERT INTO leave_applications (userId, startDate, endDate, reason, type, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `, [req.user.id, formattedFrom, formattedTo, reason, type]);

    // Redirect back to the leave applications page after applying
    res.redirect('/student/leave');

  } catch (err) {
    console.error('Error applying for leave:', err);
    res.render('student/ApplyLeave', { 
      user: req.user, 
      error: 'Failed to apply for leave. Please try again.' 
    });
  }
});


// Show Leave Application Details
app.get('/student/leave/:id', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const [leave] = await db.query(`
      SELECT * FROM leave_applications WHERE id = ? AND userId = ?
    `, [req.params.id, req.user.id]);

    if (!leave) {
      return res.redirect('/student/leave');
    }

    // Format dates
    leave.from = new Date(leave.startDate);  // ✅ correct field
  leave.to = new Date(leave.endDate);      // ✅ correct field

    res.render('student/LeaveDetails', { 
      user: req.user, 
      leave: leave 
    });

  } catch (err) {
    console.error('Error fetching leave details:', err);
    res.redirect('/student/leave');
  }
});


// Admin approves leave application
app.post('/admin/leave/approve/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [leave] = await db.query(`
      UPDATE leave_applications SET status = 'Approved' WHERE id = ?
    `, [req.params.id]);

    res.redirect('/admin/leave');
  } catch (err) {
    console.error('Error approving leave:', err);
    res.redirect('/admin/leave');
  }
});

// Admin rejects leave application
app.post('/admin/leave/reject/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [leave] = await db.query(`
      UPDATE leave_applications SET status = 'Rejected' WHERE id = ?
    `, [req.params.id]);

    res.redirect('/admin/leave');
  } catch (err) {
    console.error('Error rejecting leave:', err);
    res.redirect('/admin/leave');
  }
});






// Show All Timetables for All Students
app.get('/student/timetable', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    // Query to get all timetable data from the database
    const [timetableRows] = await db.query(`
      SELECT day, startTime, endTime, subject, teacher, room
      FROM timetables
      ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `);

    // Check if timetable data exists
    if (timetableRows.length === 0) {
      return res.render('student/timetable', { 
        user: req.user, 
        timetable: null, 
        error: 'No timetable available.' 
      });
    }

    // Group timetable by days
    const timetable = timetableRows.reduce((acc, row) => {
      if (!acc[row.day]) {
        acc[row.day] = [];
      }
      acc[row.day].push({
        subject: row.subject,
        startTime: row.startTime,
        endTime: row.endTime,
        teacher: row.teacher,
        room: row.room
      });
      return acc;
    }, {});

    // Prepare the timetable object with day-wise schedule
    const schedule = Object.keys(timetable).map(day => ({
      day,
      slots: timetable[day]
    }));

    res.render('student/timetable', { user: req.user, timetable: { schedule } });

  } catch (err) {
    console.error('Error fetching timetables:', err);
    res.render('student/timetable', { 
      user: req.user, 
      timetable: null, 
      error: 'Failed to load timetables.' 
    });
  }
});

app.get('/student/assignments', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    // Fetch all assignments
    const [assignments] = await db.query(`
      SELECT id, title, dueDate 
      FROM assignments
      ORDER BY dueDate ASC
    `);

    // Fetch current student's submissions
    const [submissions] = await db.query(`
      SELECT assignmentId, submittedAt 
      FROM assignment_submissions 
      WHERE studentId = ?
    `, [req.user.id]);

    // Map submissions to assignmentId
    const submissionMap = {};
    submissions.forEach(s => {
      submissionMap[s.assignmentId] = s;
    });

    // Attach submission info to assignments
    const mergedAssignments = assignments.map(a => ({
      ...a,
      submission: submissionMap[a.id] || null
    }));

    res.render('student/assignments', { user: req.user, assignments: mergedAssignments });

  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.render('student/assignments', { user: req.user, assignments: [], error: 'Failed to load assignments.' });
  }
});

app.post('/student/assignments/submit', authMiddleware, roleMiddleware(['student']), upload.single('submission'), async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const submissionPath = req.file ? req.file.path : null;

    if (!submissionPath) {
      return res.status(400).send('No file uploaded.');
    }

    // Save submission to DB
    await db.query(`
      INSERT INTO assignment_submissions (assignmentId, studentId, submission)
      VALUES (?, ?, ?)
    `, [assignmentId, req.user.id, submissionPath]);

    res.redirect('/student/assignments');
  } catch (err) {
    console.error('Error submitting assignment:', err);
    res.status(500).send('Failed to submit assignment.');
  }
});



// Display Finance Records
app.get('/student/finance', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    // Fetch finance records for the logged-in user
    const [payments] = await db.query(`
      SELECT * FROM finance WHERE userId = ? ORDER BY date DESC
    `, [req.user.id]);

    res.render('student/finance', { user: req.user, payments: payments });
  } catch (err) {
    console.error('Error fetching finance records:', err);
    res.render('student/finance', { user: req.user, payments: [], error: 'Failed to load finance records.' });
  }
});

// Display the Pay form
app.get('/student/finance/pay', authMiddleware, roleMiddleware(['student']), (req, res) => {
  res.render('student/pay', { user: req.user });
});

// Handle Payment Submission
app.post('/student/finance/pay', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { amount, method, description } = req.body;

  try {
    // Insert the payment record into the database
    const [result] = await db.query(`
      INSERT INTO finance (userId, amount, method, description)
      VALUES (?, ?, ?, ?)
    `, [req.user.id, amount, method, description]);

    // Redirect back to the finance page after payment is recorded
    res.redirect('/student/finance');
  } catch (err) {
    console.error('Error processing payment:', err);
    res.redirect('/student/finance');
  }
});

// Show the communication page with messages
app.get('/student/communication', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    // Fetch messages where the user is either the sender or the receiver
    const [messages] = await db.query(`
      SELECT * FROM messages 
      WHERE senderId = ? OR receiverId = ? 
      ORDER BY sentAt DESC
    `, [req.user.id, req.user.id]);

    res.render('student/communication', { user: req.user, messages: messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.render('student/communication', { user: req.user, messages: [] });
  }
});

// Handle message sending
app.post('/student/communication/send', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { to, content } = req.body;

  try {
    // Ensure that the recipient (receiverId) exists in the users table
    const [recipient] = await db.query('SELECT * FROM users WHERE id = ?', [to]);

    if (!recipient) {
      return res.status(400).send('Recipient user not found.');
    }

    // Insert message into the database
    await db.query(`
      INSERT INTO messages (senderId, receiverId, content, sentAt) 
      VALUES (?, ?, ?, NOW())
    `, [req.user.id, to, content]);

    // Redirect back to the communication page to show the updated messages
    res.redirect('/student/communication');
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).send('Failed to send message.');
  }
});


app.get('/student/calendar', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    // Fetch events from the calendar table
    const [events] = await db.query(`
      SELECT * FROM calendar 
      ORDER BY eventDate ASC
    `);

    // Render the calendar page with the fetched events
    res.render('student/calendar', { user: req.user, events: events });
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    res.render('student/calendar', { user: req.user, events: [], error: 'Failed to load events.' });
  }
});




app.post('/student/feedback/submit', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { courseId, instructorId, rating, comments } = req.body;
  
  try {
    // Insert the feedback data into the feedback table
    const [result] = await db.query(`
      INSERT INTO feedback (userId, courseId, instructorId, rating, comments)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, courseId, instructorId, rating, comments]);

    // Redirect to the feedback page after successful submission
    res.redirect('/student/feedback');
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.redirect('/student/feedback');  // Redirect back if there is an error
  }
});

app.get('/student/feedback', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    // Fetch feedback for the logged-in user with instructor details
    const [feedbacks] = await db.query(`
      SELECT f.*, u.name AS instructorName
      FROM feedback f
      LEFT JOIN users u ON f.instructorId = u.id
      WHERE f.userId = ? 
      ORDER BY f.date DESC
    `, [req.user.id]);

    // Render the feedback page with the fetched feedbacks
    res.render('student/feedback', { user: req.user, feedbacks: feedbacks });
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.render('student/feedback', { user: req.user, feedbacks: [], error: 'Failed to load feedbacks.' });
  }
});




// Teacher routes (similar structure, add as needed)
app.get('/teacher/dashboard', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  res.render('teacher/dashboard', { user: req.user });
});

// Admin routes (similar structure, add as needed)
app.get('/admin/dashboard', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  res.render('admin/dashboard', { user: req.user });
});

app.get('/admin/manageUsers', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');
    console.log('Fetched users:', users); // Log results
    res.render('admin/manageUsers', { users, user: req.user });
  } catch (err) {
    console.error('Database error:', err); // Log the actual error
    res.render('admin/manageUsers', { users: [], user: req.user, error: 'Failed to fetch users.' });
  }
}); 

app.get('/admin/attendance', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { studentId } = req.query;
    let query = `
      SELECT a.*, u.name AS studentName, m.name AS markedByName
      FROM attendance a
      JOIN users u ON a.studentId = u.id
      LEFT JOIN users m ON a.markedBy = m.id
    `;
    
    const queryParams = [];

    if (studentId) {
      query += ' WHERE a.studentId = ?';
      queryParams.push(studentId);
    }

    query += ' ORDER BY a.date DESC';

    const [attendance] = await db.query(query, queryParams);

    res.render('admin/attendance', { 
      attendance,
      user: req.user
    });

  } catch (err) {
    console.error('Attendance database error:', err);
    res.render('admin/attendance', { 
      attendance: [],
      user: req.user,
      error: 'Failed to fetch attendance records' 
    });
  }
});


app.get('/admin/grades', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { studentId } = req.query;
    let query = `
      SELECT 
        g.*, 
        u.name AS studentName,
        gb.name AS gradedByName
      FROM grades g
      JOIN users u ON g.studentId = u.id
      LEFT JOIN users gb ON g.gradedBy = gb.id
    `;

    const params = [];

    if (studentId) {
      query += ' WHERE g.studentId = ?';
      params.push(studentId);
    }

    query += ' ORDER BY g.semester DESC, g.course ASC';

    const [grades] = await db.query(query, params);

    res.render('admin/grades', {
      grades,
      user: req.user
    });

  } catch (err) {
    console.error('Grades database error:', err);
    res.render('admin/grades', {
      grades: [],
      user: req.user,
      error: 'Failed to fetch grades records'
    });
  }
});

app.get('/admin/leave', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Get all leave applications with user names and reviewer names
    const [leaves] = await db.query(`
      SELECT 
        l.*, 
        u.name AS userName,
        r.name AS reviewedByName
      FROM leave_applications l
      JOIN users u ON l.userId = u.id
      LEFT JOIN users r ON l.reviewedBy = r.id
      ORDER BY l.appliedAt DESC
    `);

    console.log('Fetched leaves:', leaves);
    res.render('admin/leave', { 
      leaves,
      user: req.user 
    });

  } catch (err) {
    console.error('Leave database error:', err);
    res.render('admin/leave', { 
      leaves: [],
      user: req.user,
      error: 'Failed to fetch leave applications' 
    });
  }
});

app.get('/admin/timetable', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [timetables] = await db.query(`
      SELECT t.*, u.name AS teacherName
      FROM timetables t
      LEFT JOIN users u ON t.teacher = u.name
      ORDER BY t.classId ASC, t.day ASC, t.startTime ASC
    `);

    // Always pass `error: null` in the success case
    res.render('admin/timetable', { 
      timetables, 
      user: req.user,
      error: null // <-- Add this line
    });

  } catch (err) {
    console.error('Timetable database error:', err);
    res.render('admin/timetable', { 
      timetables: [], 
      user: req.user, 
      error: 'Failed to fetch timetables' 
    });
  }
});



app.get('/admin/assignments', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [assignments] = await db.query(`
      SELECT 
        a.*, 
        u.name AS createdByName
      FROM assignments a
      LEFT JOIN users u ON a.createdBy = u.id
      ORDER BY a.dueDate DESC
    `);

    const assignmentIds = assignments.map(a => a.id);

    let submissions = [];

    if (assignmentIds.length > 0) {
      [submissions] = await db.query(`
        SELECT assignmentId, COUNT(*) AS submissionCount
        FROM assignment_submissions
        WHERE assignmentId IN (?)
        GROUP BY assignmentId
      `, [assignmentIds]);
    }

    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.assignmentId] = sub.submissionCount;
    });

    // Merge submission count into each assignment
    const assignmentsWithSubmissions = assignments.map(a => ({
      ...a,
      submissionCount: submissionMap[a.id] || 0
    }));

    res.render('admin/assignments', { 
      assignments: assignmentsWithSubmissions,
      user: req.user 
    });

  } catch (err) {
    console.error('Assignments database error:', err);
    res.render('admin/assignments', { 
      assignments: [],
      user: req.user,
      error: 'Failed to fetch assignments' 
    });
  }
});


app.get('/admin/finance', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT 
        f.*, 
        u.name AS userName
      FROM finance f
      JOIN users u ON f.userId = u.id
      ORDER BY f.date DESC
    `);

    console.log('Fetched payments:', payments);
    res.render('admin/finance', { 
      payments,
      user: req.user 
    });

  } catch (err) {
    console.error('Finance database error:', err);
    res.render('admin/finance', { 
      payments: [],
      user: req.user,
      error: 'Failed to fetch finance records' 
    });
  }
});

app.get('/admin/communication', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [messages] = await db.query(`
      SELECT 
        m.*,
        sender.name AS senderName,
        receiver.name AS receiverName
      FROM messages m
      JOIN users sender ON m.senderId = sender.id
      JOIN users receiver ON m.receiverId = receiver.id
      ORDER BY m.sentAt DESC
    `);

    // Transform to match expected structure in EJS
    const formattedMessages = messages.map(msg => ({
      ...msg,
      from: { name: msg.senderName },
      to: { name: msg.receiverName },
    }));

    res.render('admin/communication', {
      user: req.user,
      messages: formattedMessages
    });

  } catch (err) {
    console.error('Fetch messages error:', err);
    res.render('admin/communication', {
      user: req.user,
      messages: [],
      error: 'Failed to load messages'
    });
  }
});


app.get('/admin/calendar', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [events] = await db.query(`
      SELECT 
        c.*, 
        u.name AS createdByName
      FROM calendar c
      LEFT JOIN users u ON c.createdBy = u.id
      ORDER BY c.eventDate DESC
    `);

    console.log('Fetched calendar events:', events);
    res.render('admin/calendar', { 
      events,
      user: req.user 
    });

  } catch (err) {
    console.error('Calendar database error:', err);
    res.render('admin/calendar', { 
      events: [],
      user: req.user,
      error: 'Failed to fetch calendar events' 
    });
  }
});

app.get('/admin/feedback', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [feedbacks] = await db.query(`
      SELECT 
        f.*, 
        u.name AS userName, 
        i.name AS instructorName
      FROM feedback f
      JOIN users u ON f.userId = u.id
      LEFT JOIN users i ON f.instructorId = i.id
      ORDER BY f.date DESC
    `);

    // Replace userId and instructorId with name fields for rendering ease
    const formattedFeedbacks = feedbacks.map(f => ({
      ...f,
      user: { name: f.userName },
      instructor: f.instructorName ? { name: f.instructorName } : null
    }));

    res.render('admin/feedback', {
      feedbacks: formattedFeedbacks,
      user: req.user
    });
  } catch (err) {
    console.error('Feedback DB error:', err);
    res.render('admin/feedback', {
      feedbacks: [],
      user: req.user,
      error: 'Failed to fetch feedback records'
    });
  }
});


app.get('/admin/timetable/add', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Optionally, fetch teachers for a dropdown
    const [teachers] = await db.query('SELECT id, name FROM users WHERE role = "teacher"');
    res.render('admin/addTimetable', { user: req.user, teachers, error: null });
  } catch (err) {
    console.error('Timetable add (GET) error:', err);
    res.redirect('/admin/timetable');
  }
});

app.post('/admin/timetable/add', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { classId, day, startTime, endTime, subject, teacher, room } = req.body;
    await db.query(
      'INSERT INTO timetables (classId, day, startTime, endTime, subject, teacher, room) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [classId, day, startTime, endTime, subject, teacher, room]
    );
    res.redirect('/admin/timetable');
  } catch (err) {
    console.error('Timetable add (POST) error:', err);
    // Optionally, fetch teachers again for the form
    const [teachers] = await db.query('SELECT id, name FROM users WHERE role = "teacher"');
    res.render('admin/addTimetable', { user: req.user, teachers, error: 'Failed to add timetable entry' });
  }
});

app.get('/admin/editUser/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    // Fetch the user to edit
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const userToEdit = rows[0];
    if (!userToEdit) {
      // If user not found, redirect to manage users
      return res.redirect('/admin/manageUsers');
    }
    res.render('admin/editUser', { user: req.user, userToEdit, error: null });
  } catch (err) {
    console.error('Edit user (GET) error:', err);
    res.redirect('/admin/manageUsers');
  }
});

app.post('/admin/editUser/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, department, enrollmentNo, employeeId } = req.body;
    // Update the user in the database
    await db.query(
      'UPDATE users SET name=?, email=?, role=?, department=?, enrollmentNo=?, employeeId=? WHERE id=?',
      [name, email, role, department, enrollmentNo, employeeId, userId]
    );
    res.redirect('/admin/manageUsers');
  } catch (err) {
    console.error('Edit user (POST) error:', err);
    // Fetch the user again to re-fill the form in case of error
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const userToEdit = rows[0] || { ...req.body, id: req.params.id };
    res.render('admin/editUser', {
      user: req.user,
      userToEdit,
      error: 'Failed to update user'
    });
  }
});

// … other requires, db setup, middlewares, etc …

// GET: show delete confirmation
app.get(
  '/admin/deleteUser/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const userId = req.params.id;
      // only grab the columns we need, and alias the PK to "id"
      const [rows] = await db.query(
        `SELECT id AS id, name, email, role
         FROM users
         WHERE id = ?`,
        [userId]
      );

      if (rows.length === 0) {
        // no such user → back to list
        return res.redirect('/admin/manageUsers');
      }

      const userToDelete = rows[0];
      console.log('🕵️‍♂️  GET deleteUser, fetched:', userToDelete);
      res.render('admin/deleteUser', {
        user: req.user,
        userToDelete,
        error: null,
      });
    } catch (err) {
      console.error('❌ Delete user (GET) error:', err);
      res.redirect('/admin/manageUsers');
    }
  }
);

// POST: actually delete
app.post(
  '/admin/deleteUser/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    const userId = req.params.id;

    try {
      console.log('🗑️  POST deleteUser, deleting id =', userId);

      // Remove any foreign key dependent data
      await db.query('DELETE FROM assignment_submissions WHERE studentId = ?', [userId]);
      await db.query('UPDATE assignments SET createdBy = NULL WHERE createdBy = ?', [userId]);
      await db.query('DELETE FROM leave_applications WHERE userId = ?', [userId]);
      await db.query('UPDATE timetables SET teacher = NULL WHERE teacher = ?', [userId]);

      // Finally, delete the user
      await db.query('DELETE FROM users WHERE id = ?', [userId]);

      res.redirect('/admin/manageUsers');
    } catch (err) {
      console.error('❌ Delete user (POST) error:', err.message);

      try {
        const [rows] = await db.query(
          `SELECT id AS id, name, email, role FROM users WHERE id = ?`,
          [userId]
        );

        const userToDelete = rows[0];
        res.render('admin/deleteUser', {
          user: req.user,
          userToDelete,
          error: 'Failed to delete user: ' + err.message,
        });
      } catch (fetchErr) {
        console.error('❌ Error re-fetching user for error view:', fetchErr.message);
        res.redirect('/admin/manageUsers');
      }
    }
  }
);


// GET: Render the add assignment form
app.get(
  '/admin/assignments/add',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      // fetch teachers for the “Assigned By” dropdown
      const [teachers] = await db.query(
        'SELECT id, name FROM users WHERE role = "teacher"'
      );
      console.log('🖊️  Fetched teachers for assignments:', teachers);
      res.render('admin/addAssignment', {
        user: req.user,
        teachers,
        error: null
      });
    } catch (err) {
      console.error('❌ Assignment add (GET) error:', err);
      res.redirect('/admin/assignments');
    }
  }
);

app.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.render('auth/register', { user: null, error: 'All fields are required.' });
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.render('auth/register', { user: null, error: 'Email already registered.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user with hashed password
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Registration error:', err);
    res.render('auth/register', { user: null, error: 'Registration failed. Try again.' });
  }
});




// POST: Handle form submission to add a new assignment
app.post(
  '/admin/assignments/add',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const { title, description, dueDate, classId, createdBy } = req.body;

      // match your schema exactly (camelCase column names)
      await db.query(
        `INSERT INTO assignments
           (title, description, dueDate, classId, createdBy)
         VALUES (?, ?, ?, ?, ?)`,
        [title, description, dueDate, classId, createdBy]
      );

      console.log('✅ New assignment created:', { title, dueDate, classId, createdBy });
      res.redirect('/admin/assignments');
    } catch (err) {
      console.error('❌ Assignment add (POST) error:', err);

      // re‑fetch teachers so the dropdown still renders
      const [teachers] = await db.query(
        'SELECT id, name FROM users WHERE role = "teacher"'
      );
      res.render('admin/addAssignment', {
        user: req.user,
        teachers,
        error: 'Failed to add assignment'
      });
    }
  }
);

// GET: Show add event form
app.get('/admin/calendar/addEvent', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    res.render('admin/addEvent', { user: req.user, error: null });
  } catch (err) {
    console.error('Error loading add event form:', err);
    res.render('admin/addEvent', { user: req.user, error: 'Failed to load add event form' });
  }
});

// POST: Add event
app.post('/admin/calendar/addEvent', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { title, eventDate, description } = req.body;
    const createdBy = req.user.id;

    if (!title.trim() || !eventDate) {
      return res.render('admin/addEvent', { user: req.user, error: 'All fields are required' });
    }

    // Ensure eventDate is in 'YYYY-MM-DD' format (in case of any additional manipulations)
    const formattedEventDate = new Date(eventDate).toISOString().split('T')[0];  // 'YYYY-MM-DD'

    // Insert event data into the calendar table
    await db.query(
      'INSERT INTO calendar (title, eventDate, description, createdBy) VALUES (?, ?, ?, ?)',
      [title, formattedEventDate, description, createdBy]
    );

    // Redirect to the add event form after successfully adding the event
    res.redirect('/admin/calendar/addEvent');
  } catch (err) {
    console.error('Error adding event:', err);
    res.render('admin/addEvent', { user: req.user, error: 'Failed to add event' });
  }
});

// GET route to show attendance records
app.get('/teacher/attendance', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const [attendance] = await db.query(`
      SELECT a.*, u.name AS studentName
      FROM attendance a
      JOIN users u ON a.studentId = u.id
      WHERE a.markedBy = ?
      ORDER BY a.date DESC
    `, [req.user.id]);

    res.render('teacher/attendance', { user: req.user, attendance, error: null });
  } catch (err) {
    console.error('Error fetching attendance data:', err);
    res.render('teacher/attendance', { user: req.user, attendance: [], error: 'Failed to load attendance data' });
  }
});


// GET: Mark Attendance Page
// GET route to show the form for marking attendance
app.get('/teacher/attendance/mark', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    // Fetch students assigned to the teacher
    const [students] = await db.query(`
      SELECT id, name FROM users WHERE role = 'student'
    `);

    // Render the markAttendance view, passing students data
    res.render('teacher/markAttendance', { user: req.user, students, error: null });
  } catch (err) {
    console.error('Error loading attendance form:', err);
    res.render('teacher/markAttendance', { user: req.user, students: [], error: 'Failed to load attendance form' });
  }
});



// POST: Mark Attendance Submission
app.post('/teacher/attendance/mark', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { studentId, date, status, course } = req.body;
    const teacherId = req.user.id;  // Use the teacher's ID from the logged-in user

    // Ensure all required fields are present
    if (!studentId || !date || !status) {
      return res.render('teacher/markAttendance', { user: req.user, error: 'All fields are required' });
    }

    // Insert attendance record into the database
    await db.query(
      'INSERT INTO attendance (studentId, date, status, course, markedBy) VALUES (?, ?, ?, ?, ?)',
      [studentId, date, status, course, teacherId]  // Insert the logged-in teacher's ID in markedBy
    );

    // Redirect back to the attendance page to show the updated attendance
    res.redirect('/teacher/attendance');
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.render('teacher/markAttendance', { user: req.user, error: 'Failed to mark attendance' });
  }
});

// GET route to fetch grades
app.get('/teacher/grades', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    // Fetch grades from the database along with student names and course details
    const [grades] = await db.query(`
      SELECT g.id, g.course, g.semester, g.grade, u.name as studentName, g.gradedBy, u.id as studentId
      FROM grades g
      JOIN users u ON g.studentId = u.id
      WHERE g.gradedBy = ?`, [req.user.id]);
    
    // If no grades are found, render with empty grades array
    if (grades.length === 0) {
      return res.render('teacher/grades', { user: req.user, grades: [], error: 'No grades found' });
    }

    // Render the grades view with grades data
    res.render('teacher/grades', { user: req.user, grades: grades, error: '' });
  } catch (err) {
    console.error('Error fetching grades:', err);
    res.render('teacher/grades', { user: req.user, grades: [], error: 'Failed to load grades' });
  }
});


// GET route to show the add grade form
// GET route to show the add grade form
app.get('/teacher/grades/add', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    // Fetch all students who have 'student' role (adjust this query to match your schema)
    const [students] = await db.query('SELECT id, name FROM users WHERE role = "student"');
    
    // If no students are found, pass an error
    if (students.length === 0) {
      return res.render('teacher/addGrade', { user: req.user, students: [], error: 'No students found' });
    }

    // Render the form with the students data
    res.render('teacher/addGrade', { user: req.user, students: students, error: '' });
  } catch (err) {
    console.error('Error loading add grade form:', err);
    res.render('teacher/addGrade', { user: req.user, students: [], error: 'Failed to load students' });
  }
});


// POST route to add the grade to the database
app.post('/teacher/grades/add', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { studentId, course, semester, grade } = req.body;
    const gradedBy = req.user.id;

    // Validate input data
    if (!studentId || !course || !semester || !grade) {
      return res.render('teacher/addGrade', { user: req.user, error: 'All fields are required' });
    }

    // Insert the grade data into the database
    await db.query(
      'INSERT INTO grades (studentId, course, semester, grade, gradedBy) VALUES (?, ?, ?, ?, ?)',
      [studentId, course, semester, grade, gradedBy]
    );

    // Redirect to the grades page after successfully adding the grade
    res.redirect('/teacher/grades');
  } catch (err) {
    console.error('Error adding grade:', err);
    res.render('teacher/addGrade', { user: req.user, error: 'Failed to add grade' });
  }
});

// GET route for teacher's timetable
app.get('/teacher/timetable', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  console.log('req.user:', req.user);
  try {
    console.log("User Info:", req.user);
    const teacherName = req.user.name;

    const [timetables] = await db.query(
      'SELECT * FROM timetables WHERE teacher = ? ORDER BY FIELD(day, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), startTime',
      [teacherName]
    );

    console.log("Fetched Timetables:", timetables);

    res.render('teacher/timetable', {
      user: req.user,
      timetables,
      error: null
    });
  } catch (err) {
    console.error('Error loading timetable:', err);
    res.render('teacher/timetable', {
      user: req.user || null,
      timetables: [],
      error: 'Failed to load timetable'
    });
  }
});



// GET route to display assignments and form to create one
app.get('/teacher/assignments', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const [assignments] = await db.query('SELECT * FROM assignments WHERE createdBy = ?', [req.user.id]);

    // Get all assignment IDs
    const assignmentIds = assignments.map(a => a.id);

    let submissions = [];

    // Only fetch submissions if there are assignments
    if (assignmentIds.length > 0) {
      [submissions] = await db.query(`
        SELECT assignmentId, COUNT(*) AS submissionCount
        FROM assignment_submissions
        WHERE assignmentId IN (?)
        GROUP BY assignmentId
      `, [assignmentIds]);
    }

    // Create a lookup map for faster access
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.assignmentId] = sub.submissionCount;
    });

    // Merge submission counts into assignments
    const assignmentsWithSubmissions = assignments.map(a => ({
      ...a,
      submissions: Array(submissionMap[a.id] || 0).fill(null) // Create array of nulls to match EJS logic
    }));

    res.render('teacher/assignments', { user: req.user, assignments: assignmentsWithSubmissions });

  } catch (err) {
    console.error('Error loading assignments:', err);
    res.render('teacher/assignments', { user: req.user, assignments: [], error: 'Failed to load assignments' });
  }
});


app.get('/teacher/assignments/create', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  res.render('teacher/createAssignment', { user: req.user, error: null });
});

app.post('/teacher/assignments/create', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { title, description, dueDate, classId } = req.body;

  if (!title || !dueDate || !classId) {
    return res.render('teacher/createAssignment', {
      user: req.user,
      error: 'Title, Due Date, and Class ID are required.'
    });
  }

  try {
    await db.query(
      'INSERT INTO assignments (title, description, dueDate, classId, createdBy) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', dueDate, classId, req.user.id]
    );

    res.redirect('/teacher/assignments');
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.render('teacher/createAssignment', {
      user: req.user,
      error: 'Failed to create assignment.'
    });
  }
});

app.get('/teacher/communication', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const [messages] = await db.query(`
      SELECT m.*, 
             sender.name AS senderName, 
             receiver.name AS receiverName 
      FROM messages m
      JOIN users sender ON m.senderId = sender.id
      JOIN users receiver ON m.receiverId = receiver.id
      WHERE m.senderId = ? OR m.receiverId = ?
      ORDER BY m.sentAt DESC
    `, [req.user.id, req.user.id]);

    const formattedMessages = messages.map(msg => ({
      from: { name: msg.senderName },
      to: { name: msg.receiverName },
      content: msg.content,
      sentAt: msg.sentAt
    }));

    res.render('teacher/communication', { user: req.user, messages: formattedMessages });
  } catch (err) {
    console.error('Error loading messages:', err);
    res.render('teacher/communication', { user: req.user, messages: [], error: 'Failed to load messages' });
  }
});


app.post('/teacher/communication/send', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { to, content } = req.body;
  const senderId = req.user.id;

  if (!to || !content) {
    return res.render('teacher/communication', {
      user: req.user,
      messages: [],
      error: 'Recipient and message content are required.'
    });
  }

  try {
    // Ensure recipient exists
    const [recipient] = await db.query('SELECT id FROM users WHERE id = ?', [to]);
    if (recipient.length === 0) {
      return res.render('teacher/communication', {
        user: req.user,
        messages: [],
        error: 'Recipient not found.'
      });
    }

    await db.query(
      'INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)',
      [senderId, to, content]
    );

    res.redirect('/teacher/communication');
  } catch (err) {
    console.error('Error sending message:', err);
    res.render('teacher/communication', {
      user: req.user,
      messages: [],
      error: 'Failed to send message.'
    });
  }
});

// GET route to show send message form
app.get('/teacher/communication/send', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  res.render('teacher/sendMessage', { user: req.user });
});


// GET route to show the calendar
app.get('/teacher/calendar', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    // Fetch all calendar events from the database
    const [events] = await db.query('SELECT * FROM calendar ORDER BY eventDate ASC');
    
    // Ensure the eventDate is a valid Date object
    events.forEach(e => {
      if (e.eventDate) {
        e.eventDate = new Date(e.eventDate);  // Convert eventDate to JavaScript Date object
      }
    });

    // Render the calendar view with the events
    res.render('teacher/calendar', { user: req.user, events: events });
  } catch (err) {
    console.error('Error loading calendar events:', err);
    res.render('teacher/calendar', { user: req.user, events: [], error: 'Failed to load events' });
  }
});


// GET route to show the Add Event form
app.get('/teacher/calendar/add', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  res.render('teacher/addCalendarEvent', { user: req.user, error: '' });
});


// POST route to add the event to the calendar
app.post('/teacher/calendar/add', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { title, eventDate, description } = req.body;
    const createdBy = req.user.id;

    // Validate input data
    if (!title || !eventDate || !description) {
      return res.render('teacher/addCalendarEvent', { user: req.user, error: 'All fields are required' });
    }

    // Insert the event into the database
    await db.query(
      'INSERT INTO calendar (title, eventDate, description, createdBy) VALUES (?, ?, ?, ?)',
      [title, eventDate, description, createdBy]
    );

    // Redirect to the calendar page after successfully adding the event
    res.redirect('/teacher/calendar');
  } catch (err) {
    console.error('Error adding event:', err);
    res.render('teacher/addCalendarEvent', { user: req.user, error: 'Failed to add event' });
  }
});
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Validate input
    if (!email || !password) {
      return res.render('auth/login', { user: null, error: 'Email and password are required.' });
    }

    // 2. Find user by email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.render('auth/login', { user: null, error: 'Invalid email or password.' });
    }
    const user = users[0];

    // 3. Check password (assuming passwords are hashed)
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.render('auth/login', { user: null, error: 'Invalid email or password.' });
    }

    // 4. Create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Set cookie for authentication
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // 6. Redirect based on role
    if (user.role === 'student') {
      return res.redirect('/student/dashboard');
    } else if (user.role === 'teacher') {
      return res.redirect('/teacher/dashboard');
    } else if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', { user: null, error: 'Login failed. Please try again.' });
  }
});


// GET: Render the feedback page for the teacher (view feedback)
app.get(
  '/teacher/feedback',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {
    try {
      // Fetch all feedback given to this teacher
      const [feedbacks] = await db.query(
        `SELECT f.*, u.name AS userId 
         FROM feedback f 
         JOIN users u ON f.userId = u.id 
         WHERE f.instructorId = ?`,
        [req.user.id]
      );

      console.log('📊  Feedback fetched:', feedbacks);
      res.render('teacher/feedback', {
        user: req.user,
        feedbacks,
        error: null
      });
    } catch (err) {
      console.error('❌ Feedback fetch (GET) error:', err);
      res.render('teacher/feedback', {
        user: req.user,
        feedbacks: [],
        error: 'Failed to load feedback'
      });
    }
  }
);

// Show leave application table
app.get('/teacher/leave', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const [leaves] = await db.query(
      'SELECT * FROM leave_applications WHERE userId = ? ORDER BY appliedAt DESC',
      [req.user.id]
    );
    res.render('teacher/leave', { user: req.user, leaves });
  } catch (err) {
    console.error('Error loading leaves:', err);
    res.render('teacher/leave', { user: req.user, leaves: [], error: 'Could not load leaves.' });
  }
});

// Show form to apply for leave
app.get('/teacher/leave/apply', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  res.render('teacher/applyLeave', { user: req.user });
});

// Handle leave application submission
app.post('/teacher/leave/apply', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { startDate, endDate, type, reason } = req.body;

  try {
    await db.query(
      'INSERT INTO leave_applications (userId, startDate, endDate, type, reason) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, startDate, endDate, type, reason]
    );
    res.redirect('/teacher/leave');
  } catch (err) {
    console.error('Leave application error:', err);
    res.redirect('/teacher/leave/apply');
  }
});

// GET route to display the send message form
app.get('/admin/communication/send', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Fetch all users to display in the "To" dropdown
    const [users] = await db.query('SELECT id, name, email FROM users WHERE id != ?', [req.user.id]);

    res.render('admin/sendMessage', { user: req.user, users, error: '' });
  } catch (err) {
    console.error('Error loading send message form:', err);
    res.render('admin/sendMessage', { user: req.user, users: [], error: 'Failed to load users' });
  }
});

// POST route to handle message sending
app.post('/admin/communication/send', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    // Validate required fields
    if (!receiverId || !content) {
      const [users] = await db.query('SELECT id, name, email FROM users WHERE id != ?', [req.user.id]);
      return res.render('admin/sendMessage', { user: req.user, users, error: 'All fields are required' });
    }

    // Insert message into the database
    await db.query(
      'INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content]
    );

    res.redirect('/admin/communication'); // Redirect to communication center or confirmation page
  } catch (err) {
    console.error('Error sending message:', err);
    const [users] = await db.query('SELECT id, name, email FROM users WHERE id != ?', [req.user.id]);
    res.render('admin/sendMessage', { user: req.user, users, error: 'Failed to send message' });
  }
});

app.post('/admin/leave/approve/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const leaveId = req.params.id;

    await db.query(
      `UPDATE leave_applications SET status = 'Approved', reviewedBy = ? WHERE id = ?`,
      [req.user.id, leaveId]
    );

    res.redirect('/admin/leave');
  } catch (err) {
    console.error('Error approving leave:', err);
    res.redirect('/admin/leave');
  }
});

app.post('/admin/leave/reject/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const leaveId = req.params.id;

    await db.query(
      `UPDATE leave_applications SET status = 'Rejected', reviewedBy = ? WHERE id = ?`,
      [req.user.id, leaveId]
    );

    res.redirect('/admin/leave');
  } catch (err) {
    console.error('Error rejecting leave:', err);
    res.redirect('/admin/leave');
  }
});

//


// app.use('/api/resource-hub', resourceHubRoutes);
// app.use('/api/ai-analytics', aiAnalyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Academic OneStop backend is running.' });
});

// Error handler (should be last)
app.use(errorHandler);

module.exports = app;
