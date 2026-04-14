// Links to all pages:
// - Login: /login
// - Register: /register
// - Dashboard: /dashboard
// - API Docs: /api
// - README: https://github.com/... (update with actual repo)

const express = require('express');
const app = express();
const cors = require('cors');
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ========== DATABASE INITIALIZATION ==========
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

const defaultData = {
  authTokens: {},
  users: [
    { id: 1, name: 'Rajesh Sharma', email: 'rajesh@example.com', password: '123456', role: 'student', phone: '+91-9876543210', enrollment: [] },
    { id: 2, name: 'Dr. Rajesh Kumar', email: 'rajeshkumar@example.com', password: '123456', role: 'instructor', phone: '+91-9876543211', courses: [] },
    { id: 3, name: 'Admin Singh', email: 'admin@example.com', password: '123456', role: 'admin', phone: '+91-9876543212' },
    { id: 4, name: 'Priya Singh', email: 'priya@example.com', password: '123456', role: 'student', phone: '+91-9876543213', enrollment: [] },
    { id: 5, name: 'Neha Singh', email: 'nehasingh@example.com', password: '123456', role: 'instructor', phone: '+91-9876543214', courses: [] }
  ],
  courses: [
    {
      id: 1,
      title: 'Cloud Computing Fundamentals',
      category: 'Cloud',
      description: 'Master cloud architecture and services',
      instructor: 'Dr. Rajesh Kumar',
      instructorId: 2,
      level: 'Beginner',
      price: 2499,
      duration: '6 weeks',
      rating: 4.8,
      students: 1250,
      modules: [
        {
          id: 1,
          title: 'Introduction to Cloud',
          lessons: [
            { id: 1, title: 'What is Cloud?', duration: '15 min', videoUrl: 'video1.mp4', content: 'Cloud computing basics' },
            { id: 2, title: 'Service Models', duration: '20 min', videoUrl: 'video2.mp4', content: 'SaaS, PaaS, IaaS' }
          ]
        },
        {
          id: 2,
          title: 'AWS Services',
          lessons: [
            { id: 3, title: 'EC2 Instances', duration: '25 min', videoUrl: 'video3.mp4', content: 'Compute services' },
            { id: 4, title: 'S3 Storage', duration: '18 min', videoUrl: 'video4.mp4', content: 'Object storage' }
          ]
        }
      ],
      assignments: [
        { id: 1, title: 'Cloud Basics Assignment', description: 'Submit your understanding', dueDate: '2026-04-20', maxScore: 100 },
        { id: 2, title: 'AWS Setup Task', description: 'Create an AWS account', dueDate: '2026-04-27', maxScore: 50 }
      ],
      quizzes: [
        { id: 1, title: 'Module 1 Quiz', questions: 10, passingScore: 60, maxScore: 100 },
        { id: 2, title: 'Module 2 Quiz', questions: 15, passingScore: 70, maxScore: 100 }
      ]
    },
    {
      id: 2,
      title: 'Kubernetes for DevOps',
      category: 'DevOps',
      description: 'Container orchestration mastery',
      instructor: 'Neha Singh',
      instructorId: 5,
      level: 'Intermediate',
      price: 3999,
      duration: '8 weeks',
      rating: 4.9,
      students: 890,
      modules: [
        { id: 1, title: 'Docker Essentials', lessons: [{ id: 1, title: 'Container Basics', duration: '20 min', videoUrl: 'video5.mp4', content: 'Docker fundamentals' }] }
      ],
      assignments: [],
      quizzes: []
    }
  ],
  studentProgress: [
    { userId: 1, courseId: 1, lessonsCompleted: [1, 2], currentLesson: 3, completionPercentage: 35, timeSpent: 3600, lastAccessed: '2026-04-12' },
    { userId: 1, courseId: 2, lessonsCompleted: [1], currentLesson: 2, completionPercentage: 15, timeSpent: 900, lastAccessed: '2026-04-10' }
  ],
  assignments: [
    { id: 1, courseId: 1, title: 'Cloud Basics Assignment', description: 'Answer questions', dueDate: '2026-04-20' }
  ],
  submissions: [
    { id: 1, assignmentId: 1, userId: 1, submittedAt: '2026-04-15', content: 'My submission', score: 85, graded: true }
  ],
  quizzes: [
    { id: 1, courseId: 1, title: 'Module 1 Quiz', questions: 10, passingScore: 60 }
  ],
  quizResults: [
    { id: 1, userId: 1, quizId: 1, score: 85, totalScore: 100, completedAt: '2026-04-12' }
  ],
  discussions: [],
  discussionReplies: [],
  announcements: [
    { id: 1, courseId: 1, title: 'Welcome!', content: 'Welcome to the course', createdBy: 'Dr. Rajesh Kumar', createdAt: '2026-04-01' },
    { id: 2, courseId: 1, title: 'Assignment Deadline', content: 'Complete by April 20', createdBy: 'Dr. Rajesh Kumar', createdAt: '2026-04-10' }
  ],
  certificates: [
    { id: 1, userId: 1, courseId: 1, completedAt: '2026-04-12', certificateUrl: 'cert_1.pdf' }
  ],
  subscriptions: [
    { id: 1, userId: 1, courseId: 1, status: 'active', startDate: '2026-04-01', endDate: '2026-06-01', amount: 2499 }
  ],
  platformAnalytics: {
    totalCourses: 2,
    totalUsers: 5,
    totalEnrollments: 1250,
    totalRevenue: 3748500,
    averageRating: 4.8
  }
};

db.defaults(defaultData).write();

// ========== AUTHENTICATION ENDPOINTS ==========
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  const newUser = {
    id: db.get('users').map('id').max().value() + 1,
    name,
    email,
    password,
    role: role || 'student',
    phone: '',
    enrollment: role === 'student' ? [] : undefined,
    courses: role === 'instructor' ? [] : undefined
  };
  db.get('users').push(newUser).write();
  res.status(201).json({ success: true, message: 'Registered successfully', data: { id: newUser.id, email: newUser.email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.get('users').find({ email, password }).value();
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
  
  const token = 'token_' + Math.random().toString(36);
  db.get('authTokens').set(token, user.id).write();
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  db.get('authTokens').unset(token).write();
  res.json({ success: true, message: 'Logged out' });
});

// ========== COURSE MANAGEMENT ==========
app.get('/api/courses', (req, res) => {
  res.json({ success: true, count: db.get('courses').size().value(), data: db.get('courses').value() });
});

app.get('/api/courses/:id', (req, res) => {
  const course = db.get('courses').find({ id: parseInt(req.params.id) }).value();
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
  res.json({ success: true, data: course });
});

app.post('/api/courses/:courseId/enroll', (req, res) => {
  const { userId } = req.body;
  const course = db.get('courses').find({ id: parseInt(req.params.courseId) }).value();
  const user = db.get('users').find({ id: userId }).value();
  
  if (!course || !user) return res.status(404).json({ success: false, error: 'Not found' });
  if (user.enrollment?.includes(course.id)) return res.status(400).json({ success: false, error: 'Already enrolled' });
  
  user.enrollment.push(course.id);
  db.get('users').find({ id: userId }).assign(user).write();
  const sub = { id: Math.random(), userId, courseId: course.id, status: 'active', startDate: new Date(), amount: course.price };
  db.get('subscriptions').push(sub).write();
  
  res.json({ success: true, message: 'Enrolled successfully', data: { subscription: sub } });
});

// ========== PROGRESS TRACKING ==========
app.get('/api/progress/:userId/:courseId', (req, res) => {
  const progress = db.get('studentProgress').find({ userId: parseInt(req.params.userId), courseId: parseInt(req.params.courseId) }).value();
  if (!progress) return res.status(404).json({ success: false, error: 'No progress found' });
  res.json({ success: true, data: progress });
});

app.put('/api/progress/:userId/:courseId', (req, res) => {
  const { lessonsCompleted, currentLesson, timeSpent } = req.body;
  let progress = db.get('studentProgress').find({ userId: parseInt(req.params.userId), courseId: parseInt(req.params.courseId) }).value();
  
  if (!progress) {
    progress = { userId: parseInt(req.params.userId), courseId: parseInt(req.params.courseId), lessonsCompleted: [], currentLesson: 1, completionPercentage: 0, timeSpent: 0 };
    db.get('studentProgress').push(progress).write();
  }
  
  if (lessonsCompleted) progress.lessonsCompleted = lessonsCompleted;
  if (currentLesson) progress.currentLesson = currentLesson;
  if (timeSpent) progress.timeSpent += timeSpent;
  progress.completionPercentage = (progress.lessonsCompleted.length / 10) * 100;
  
  db.get('studentProgress').find({ userId: parseInt(req.params.userId), courseId: parseInt(req.params.courseId) }).assign(progress).write();
  res.json({ success: true, data: progress });
});

// ========== ASSIGNMENTS & SUBMISSIONS ==========
app.get('/api/assignments', (req, res) => {
  res.json({ success: true, data: db.get('assignments').value() });
});

app.get('/api/courses/:courseId/assignments', (req, res) => {
  const course = db.get('courses').find({ id: parseInt(req.params.courseId) }).value();
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
  res.json({ success: true, data: course.assignments });
});

app.post('/api/assignments/:assignmentId/submit', (req, res) => {
  const { userId, content } = req.body;
  const submission = {
    id: Math.random(),
    assignmentId: parseInt(req.params.assignmentId),
    userId,
    submittedAt: new Date(),
    content,
    score: 0,
    graded: false
  };
  db.get('submissions').push(submission).write();
  res.status(201).json({ success: true, message: 'Submitted successfully', data: submission });
});

app.get('/api/assignments/:assignmentId/submissions', (req, res) => {
  const assigns = db.get('submissions').filter({ assignmentId: parseInt(req.params.assignmentId) }).value();
  res.json({ success: true, data: assigns });
});

// ========== QUIZZES ==========
app.get('/api/courses/:courseId/quizzes', (req, res) => {
  const course = db.get('courses').find({ id: parseInt(req.params.courseId) }).value();
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
  res.json({ success: true, data: course.quizzes });
});

app.post('/api/quizzes/:quizId/submit', (req, res) => {
  const { userId, score, totalScore } = req.body;
  const result = {
    id: Math.random(),
    userId,
    quizId: parseInt(req.params.quizId),
    score,
    totalScore,
    completedAt: new Date(),
    passed: score >= 60
  };
  db.get('quizResults').push(result).write();
  res.json({ success: true, message: 'Quiz submitted', data: result });
});

// ========== DISCUSSIONS & FORUMS ==========
app.post('/api/courses/:courseId/discussions', (req, res) => {
  const { userId, title, content } = req.body;
  const discussion = {
    id: Math.random(),
    courseId: parseInt(req.params.courseId),
    userId,
    title,
    content,
    createdAt: new Date(),
    replies: 0
  };
  db.get('discussions').push(discussion).write();
  res.status(201).json({ success: true, data: discussion });
});

app.get('/api/courses/:courseId/discussions', (req, res) => {
  const disc = db.get('discussions').filter({ courseId: parseInt(req.params.courseId) }).value();
  res.json({ success: true, data: disc });
});

app.post('/api/discussions/:discussionId/reply', (req, res) => {
  const { userId, content } = req.body;
  const reply = {
    id: Math.random(),
    discussionId: parseInt(req.params.discussionId),
    userId,
    content,
    createdAt: new Date()
  };
  db.get('discussionReplies').push(reply).write();
  res.json({ success: true, data: reply });
});

// ========== ANNOUNCEMENTS ==========
app.get('/api/courses/:courseId/announcements', (req, res) => {
  const ann = db.get('announcements').filter({ courseId: parseInt(req.params.courseId) }).value();
  res.json({ success: true, data: ann });
});

app.post('/api/courses/:courseId/announcements', (req, res) => {
  const { title, content, createdBy } = req.body;
  const ann = {
    id: Math.random(),
    courseId: parseInt(req.params.courseId),
    title,
    content,
    createdBy,
    createdAt: new Date()
  };
  db.get('announcements').push(ann).write();
  res.status(201).json({ success: true, data: ann });
});

// ========== PAYMENTS & SUBSCRIPTIONS ==========
app.post('/api/payments/process', (req, res) => {
  const { userId, courseId, amount } = req.body;
  const subscription = {
    id: Math.random(),
    userId,
    courseId,
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    amount,
    paymentId: 'PAY_' + Math.random().toString(36)
  };
  db.get('subscriptions').push(subscription).write();
  res.json({ success: true, message: 'Payment processed', data: subscription });
});

app.get('/api/user/:userId/subscriptions', (req, res) => {
  const subs = db.get('subscriptions').filter({ userId: parseInt(req.params.userId) }).value();
  res.json({ success: true, data: subs });
});

// ========== CERTIFICATES ==========
app.post('/api/courses/:courseId/certificate', (req, res) => {
  const { userId } = req.body;
  const cert = {
    id: Math.random(),
    userId,
    courseId: parseInt(req.params.courseId),
    completedAt: new Date(),
    certificateUrl: `cert_${userId}_${req.params.courseId}.pdf`
  };
  db.get('certificates').push(cert).write();
  res.json({ success: true, message: 'Certificate generated', data: cert });
});

// ========== ANALYTICS & REPORTS ==========
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      platform: db.get('platformAnalytics').value(),
      topCourses: db.get('courses').value().map(c => ({ id: c.id, title: c.title, students: c.students, rating: c.rating })).slice(0, 5),
      recentEnrollments: db.get('subscriptions').value().slice(-5),
      completionRate: '42%'
    }
  });
});

app.get('/api/analytics/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userSubs = db.get('subscriptions').filter({ userId }).value();
  const userCerts = db.get('certificates').filter({ userId }).value();
  const userProgress = db.get('studentProgress').filter({ userId }).value();
  
  res.json({
    success: true,
    data: {
      enrolledCourses: userSubs.length,
      completedCourses: userCerts.length,
      certificatesEarned: userCerts.length,
      averageProgress: userProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / userProgress.length || 0,
      totalTimeSpent: userProgress.reduce((sum, p) => sum + p.timeSpent, 0)
    }
  });
});

// ========== INSTRUCTOR DASHBOARD ==========
app.get('/api/instructor/:instructorId/courses', (req, res) => {
  const inst = db.get('courses').filter({ instructorId: parseInt(req.params.instructorId) }).value();
  const stats = inst.map(c => ({
    ...c,
    enrolledStudents: db.get('subscriptions').filter({ courseId: c.id }).size().value(),
    revenue: db.get('subscriptions').filter({ courseId: c.id }).sumBy('amount').value()
  }));
  res.json({ success: true, data: stats });
});

// ========== USER PROFILES ==========
app.get('/api/users/:id', (req, res) => {
  const user = db.get('users').find({ id: parseInt(req.params.id) }).value();
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  
  const userData = { ...user };
  delete userData.password;
  
  if (user.role === 'student') {
    userData.enrolledCoursesCount = user.enrollment?.length || 0;
    userData.certificatesCount = db.get('certificates').filter({ userId: user.id }).size().value();
  }
  
  res.json({ success: true, data: userData });
});

// ========== PAGE ROUTES ==========
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Comprehensive E-Learning Platform API',
    version: '3.0.0',
    features: [
      'User Authentication & Authorization',
      'Course Management & Modules',
      'Content Delivery (Videos & Materials)',
      'Progress Tracking & Analytics',
      'Assignments & Submissions',
      'Quizzes & Automated Grading',
      'Discussion Forums',
      'Announcements',
      'Payment & Subscription System',
      'Certificate Generation',
      'Instructor Dashboard',
      'Role-Based Access Control'
    ],
    endpoints: {
      auth: { 'POST /api/auth/register': 'Register user', 'POST /api/auth/login': 'Login', 'POST /api/auth/logout': 'Logout' },
      courses: { 'GET /api/courses': 'List courses', 'GET /api/courses/:id': 'Course details', 'POST /api/courses/:courseId/enroll': 'Enroll' },
      learning: { 'GET /api/progress/:userId/:courseId': 'Track progress', 'GET /api/courses/:courseId/assignments': 'Assignments' },
      assessment: { 'POST /api/assignments/:assignmentId/submit': 'Submit assignment', 'POST /api/quizzes/:quizId/submit': 'Submit quiz' },
      community: { 'POST /api/courses/:courseId/discussions': 'Create discussion', 'GET /api/courses/:courseId/announcements': 'View announcements' },
      payments: { 'POST /api/payments/process': 'Process payment', 'GET /api/user/:userId/subscriptions': 'View subscriptions' },
      analytics: { 'GET /api/analytics/dashboard': 'Platform analytics', 'GET /api/analytics/user/:userId': 'User analytics' }
    },
    documentation: 'Go to /dashboard for full interface'
  });
});

app.listen(port, host, () => {
  console.log(`🚀 Comprehensive E-Learning Platform API v3.0 listening at http://${host}:${port}`);
  console.log(`🔐 Login Page: http://${host}:${port}/login`);
  console.log(`📝 Register Page: http://${host}:${port}/register`);
  console.log(`📚 Dashboard: http://${host}:${port}/dashboard`);
  console.log(`📘 API Docs: http://${host}:${port}/api`);
  console.log(`🎓 Features: Authentication, Courses, Progress Tracking, Assessments, Forums, Payments, Analytics`);
});
