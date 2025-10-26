const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Resend } = require('resend');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Import MongoDB models
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const Admin = require('./models/Admin');
const Class = require('./models/Class');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy setting for rate limiting
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting Configuration for Scalability
// Different limiters for different API endpoints based on their usage patterns
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // increased from 100 to 300 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests against the limit
  keyGenerator: (req) => {
    // Use X-Forwarded-For header or req.ip
    return req.headers['x-forwarded-for'] || req.ip;
  },
});

// More permissive limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Very permissive limiter for read-only operations
const readLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // 500 requests per 5 minutes
  message: 'Too many read requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Apply rate limiters to different routes
app.use('/api/auth/', authLimiter); // Auth endpoints
app.use('/api/students', readLimiter); // Student data (mostly read)
app.use('/api/classes', readLimiter); // Class data (mostly read)
app.use('/api/', standardLimiter); // All other API endpoints

// Database Connection (MongoDB Atlas)
let isConnected = false;

const connectToMongoDB = async () => {
  try {
    // Prefer MongoDB when DATABASE_URL is provided, even if DEMO_MODE is set
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '' && process.env.DATABASE_URL !== 'undefined') {
      if (process.env.DEMO_MODE === 'true') {
        console.log('⚙️  DEMO_MODE=true detected but DATABASE_URL is set. Connecting to MongoDB and ignoring demo mode.');
      }
      await mongoose.connect(process.env.DATABASE_URL, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log('🚀 Connected to MongoDB Atlas successfully!');
      console.log('📊 Database Name:', mongoose.connection.db.databaseName);
      
      // No default data will be created automatically
      console.log('🔍 No default data will be created. All data will be created through the application.');
      
      // Log collection stats
      const teacherCount = await Teacher.countDocuments();
      const classCount = await Class.countDocuments();
      const studentCount = await Student.countDocuments();
      
      console.log('📊 Database Stats:');
      console.log(`- Teachers: ${teacherCount}`);
      console.log(`- Classes: ${classCount}`);
      console.log(`- Students: ${studentCount}`);
      
    } else if (process.env.DEMO_MODE === 'true') {
      console.log('⚠️  DEMO_MODE=true and no DATABASE_URL found. Running in demo mode with in-memory storage.');
      isConnected = false;
    } else {
      console.log('⚠️  No DATABASE_URL found. Running in demo mode with in-memory storage.');
      isConnected = false;
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Running in demo mode with in-memory storage.');
    isConnected = false;
  }
};

// Import all models to ensure they're registered with Mongoose
require('./models/Admin');
require('./models/Teacher');
require('./models/Student');
require('./models/Class');
require('./models/Attendance');

// Connect to MongoDB
connectToMongoDB();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory storage for demo mode (when MongoDB is not available)
const demoData = {
  teachers: [
    {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      name: 'Demo Teacher',
      email: 'demo@teacher.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsj5qstSS', // password123
      department: 'Computer Science',
      isVerified: true,
      createdAt: new Date().toISOString()
    }
  ],
  admins: [
    {
      _id: '507f1f77bcf86cd799439111',
      id: '507f1f77bcf86cd799439111',
      name: 'Demo Admin',
      email: 'admin@attendance.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsj5qstSS', // password123
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  students: [
    {
      _id: '507f1f77bcf86cd799439012',
      id: '507f1f77bcf86cd799439012',
      name: 'John Doe',
      email: 'john@student.com',
      studentId: 'STU001',
      beaconId: 'BEACON_001',
      course: 'Computer Science',
      year: 2,
      section: 'A',
      subjects: ['507f1f77bcf86cd799439014', '507f1f77bcf86cd799439015'],
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd799439013',
      id: '507f1f77bcf86cd799439013',
      name: 'Jane Smith',
      email: 'jane@student.com',
      studentId: 'STU002',
      beaconId: 'BEACON_002',
      course: 'Computer Science',
      year: 2,
      section: 'A',
      subjects: ['507f1f77bcf86cd799439014'],
      isActive: true
    }
  ],
  classes: [
    {
      _id: '507f1f77bcf86cd799439014',
      id: '507f1f77bcf86cd799439014',
      name: 'Computer Science 101',
      teacher_id: '507f1f77bcf86cd799439011',
      course_code: 'CS101',
      schedule: 'Mon, Wed, Fri 10:00 AM',
      room: 'Room 201',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: '507f1f77bcf86cd799439015',
      id: '507f1f77bcf86cd799439015',
      name: 'Data Structures',
      teacher_id: '507f1f77bcf86cd799439011',
      course_code: 'CS201',
      schedule: 'Tue, Thu 2:00 PM',
      room: 'Room 305',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ],
  attendance: [
    {
      _id: '507f1f77bcf86cd799439016',
      id: '507f1f77bcf86cd799439016',
      student_id: '507f1f77bcf86cd799439012',
      class_id: '507f1f77bcf86cd799439014',
      status: 'present',
      timestamp: new Date().toISOString(),
      beacon_id: 'BEACON_001'
    }
  ],
  attendance_logs: [
    {
      _id: '507f1f77bcf86cd799439017',
      id: '507f1f77bcf86cd799439017',
      student_id: '507f1f77bcf86cd799439012',
      class_id: '507f1f77bcf86cd799439014',
      status: 'present',
      timestamp: new Date(),
      beacon_id: 'BEACON_001'
    }
  ]
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Helper function to get data (works with MongoDB, demo mode)
const getData = async (collection) => {
  if (isConnected) {
    switch (collection) {
      case 'teachers':
        return await Teacher.find({}).lean();
      case 'students':
        return await Student.find({}).lean();
      case 'attendance':
        return await Attendance.find({}).populate('studentId teacherId').lean();
      case 'classes':
        const Class = require('./models/Class');
        return await Class.find({}).lean();
      default:
        return [];
    }
  } else {
    return demoData[collection] || [];
  }
};

// Add this endpoint for user verification
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin data endpoints
app.get('/api/admin/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const teachers = await getData('teachers');
    const students = await getData('students');
    
    let classCount = 0;
    if (isConnected) {
      const Class = require('./models/Class');
      classCount = await Class.countDocuments();
    } else {
      classCount = (demoData.classes || []).length;
    }
    
    res.json({
      summary: {
        teacherCount: teachers.length,
        studentCount: students.length,
        classCount: classCount
      },
      teachers,
      students
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Login request received:', JSON.stringify({
    email: req.body.email ? 'provided' : 'missing',
    hasPassword: !!req.body.password,
    role: req.body.role || 'not specified'
  }));

  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Admin login only when role is explicitly 'admin'
    if (role === 'admin') {
      console.log('Admin login attempt');
      if (isConnected) {
        const admin = await Admin.findOne({ email }).select('+password_hash');
        if (!admin) {
          console.log('Admin not found:', email);
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('Admin found, checking password...');
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
          console.log('Invalid password for admin:', email);
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
          { id: admin._id, email: admin.email, name: admin.name, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        const user = { id: admin._id, email: admin.email, name: admin.name, role: 'admin' };
        console.log('Admin login successful (Mongo):', user.email);
        return res.json({ token, user });
      } else {
        // Demo mode login against in-memory data
        const admin = (demoData.admins || []).find(a => a.email === email);
        if (!admin) {
          console.log('Demo admin not found:', email);
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('Demo admin found, checking password...');
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
          console.log('Invalid password for demo admin:', email);
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
          { id: admin._id || admin.id, email: admin.email, name: admin.name, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        const user = { id: admin._id || admin.id, email: admin.email, name: admin.name, role: 'admin' };
        console.log('Admin login successful (Demo):', user.email);
        return res.json({ token, user });
      }
    }

    // Teacher login path
    console.log('Teacher login attempt');
    if (isConnected) {
      const Teacher = require('./models/Teacher');
      const teacher = await Teacher.findOne({ email }).select('+password_hash');
      if (!teacher) {
        console.log('Teacher not found:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      console.log('Teacher found, checking password...');
      const isValidPassword = await bcrypt.compare(password, teacher.password_hash);
      if (!isValidPassword) {
        console.log('Invalid password for teacher:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { id: teacher._id, email: teacher.email, name: teacher.name, role: 'teacher' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      const user = { id: teacher._id, email: teacher.email, name: teacher.name, role: 'teacher', isVerified: teacher.isVerified };
      console.log('Teacher login successful (Mongo):', user.email);
      return res.json({ token, user });
    } else {
      // Demo mode teacher login
      const teacher = (demoData.teachers || []).find(t => t.email === email);
      if (!teacher) {
        console.log('Demo teacher not found:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      console.log('Demo teacher found, checking password...');
      const isValidPassword = await bcrypt.compare(password, teacher.password_hash);
      if (!isValidPassword) {
        console.log('Invalid password for demo teacher:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { id: teacher._id || teacher.id, email: teacher.email, name: teacher.name, role: 'teacher' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      const user = { id: teacher._id || teacher.id, email: teacher.email, name: teacher.name, role: 'teacher', isVerified: teacher.isVerified };
      console.log('Teacher login successful (Demo):', user.email);
      return res.json({ token, user });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


// Helper function to add data (database or demo)
async function addData(tableName, data) {
  if (isConnected) {
    try {
      // This is a simplified version - in production you'd have proper table-specific logic
      return { success: true, data };
    } catch (error) {
      console.error(`Error adding to ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // Demo mode
  const existingIds = demoData[tableName]?.map(item => parseInt(item.id) || 0) || [0];
  const newId = Math.max(...existingIds, 0) + 1;
  const newItem = { 
    ...data, 
    id: newId.toString(), 
    _id: newId.toString(),
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  if (!demoData[tableName]) {
    demoData[tableName] = [];
  }
  
  demoData[tableName].push(newItem);
  return { success: true, data: newItem };
}

// Authentication Endpoints (Aayan's Sprint 1 Task)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Determine collection based on role (default teacher)
    const isAdmin = role === 'admin';

    // Check if account already exists in the respective collection
    if (isConnected) {
      if (isAdmin) {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      } else {
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }
    } else {
      const list = isAdmin ? await getData('admins') : await getData('teachers');
      if (list.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    if (isConnected) {
      // MongoDB mode
      try {
        if (isAdmin) {
          const newAdmin = new Admin({
            email,
            password_hash: passwordHash,
            name,
            role: 'admin'
          });
          const savedAdmin = await newAdmin.save();
          // Try welcome email (await so we can report status)
          const welcomeResultAdmin = await sendWelcomeEmail({ name, role: 'admin', email }).catch((e)=>({ success:false, error:e?.message }));
          console.log('✅ Admin saved to MongoDB:', savedAdmin._id);
          return res.status(201).json({ 
            message: 'Admin registered successfully',
            admin: {
              id: savedAdmin._id,
              email: savedAdmin.email,
              name: savedAdmin.name,
              created_at: savedAdmin.createdAt
          },
          emailStatus: welcomeResultAdmin,
          emailPreview: !welcomeResultAdmin?.success ? generateWelcomeTemplate({ name, role:'admin', email }) : undefined
          });
        } else {
          const Teacher = require('./models/Teacher');
          const newTeacher = new Teacher({
            email,
            password_hash: passwordHash,
            name,
            department: 'General',
            isVerified: false
          });
          const savedTeacher = await newTeacher.save();
          const welcomeResultTeacher = await sendWelcomeEmail({ name, role: 'teacher', email }).catch((e)=>({ success:false, error:e?.message }));
          console.log('✅ Teacher saved to MongoDB:', savedTeacher._id);
          return res.status(201).json({ 
            message: 'Teacher registered successfully',
            teacher: {
              id: savedTeacher._id,
              email: savedTeacher.email,
              name: savedTeacher.name,
              department: savedTeacher.department,
              created_at: savedTeacher.createdAt
          },
          emailStatus: welcomeResultTeacher,
          emailPreview: !welcomeResultTeacher?.success ? generateWelcomeTemplate({ name, role:'teacher', email }) : undefined
          });
        }
      } catch (mongoError) {
        console.error('Mongo registration error:', mongoError);
        // Graceful fallback to demo in-memory storage so local dev can proceed
        try {
          if (isAdmin) {
            const demoRes = await addData('admins', { email, password_hash: passwordHash, name, role: 'admin' });
            return res.status(201).json({ message: 'Admin registered in demo mode (fallback)', admin: demoRes.data, demoMode: true });
          } else {
            const demoRes = await addData('teachers', { email, password_hash: passwordHash, name });
            return res.status(201).json({ message: 'Teacher registered in demo mode (fallback)', teacher: demoRes.data, demoMode: true });
          }
        } catch (fallbackErr) {
          console.error('Demo fallback registration error:', fallbackErr);
          return res.status(500).json({ error: mongoError.message || 'MongoDB save failed' });
        }
      }
    } else {
      // Demo mode
      if (isAdmin) {
        const result = await addData('admins', { email, password_hash: passwordHash, name, role: 'admin' });
        const welcomeResultAdminDemo = await sendWelcomeEmail({ name, role: 'admin', email }).catch((e)=>({ success:false, error:e?.message }));
        return res.status(201).json({ message: 'Admin registered successfully', admin: result.data, emailStatus: welcomeResultAdminDemo, emailPreview: !welcomeResultAdminDemo?.success ? generateWelcomeTemplate({ name, role:'admin', email }) : undefined });
      } else {
        const result = await addData('teachers', { email, password_hash: passwordHash, name });
        const welcomeResultTeacherDemo = await sendWelcomeEmail({ name, role: 'teacher', email }).catch((e)=>({ success:false, error:e?.message }));
        return res.status(201).json({ message: 'Teacher registered successfully', teacher: result.data, emailStatus: welcomeResultTeacherDemo, emailPreview: !welcomeResultTeacherDemo?.success ? generateWelcomeTemplate({ name, role:'teacher', email }) : undefined });
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});


// CRUD Operations for Teachers
app.post('/api/teachers', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    if (isConnected) {
      // MongoDB mode
      const Teacher = require('./models/Teacher');
      const newTeacher = new Teacher({
        email,
        password_hash: passwordHash,
        name
      });
      const savedTeacher = await newTeacher.save();
      res.status(201).json({ 
        teacher: {
          id: savedTeacher._id,
          email: savedTeacher.email,
          name: savedTeacher.name,
          created_at: savedTeacher.createdAt
        }
      });
    } else {
      // Demo mode
      const result = await addData('teachers', { email, password_hash: passwordHash, name });
      res.status(201).json({ teacher: result.data });
    }
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CRUD Operations for Students
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const students = await getData('students');
    res.json({ students: students.sort((a, b) => a.name.localeCompare(b.name)) });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/students', authenticateToken, async (req, res) => {
  try {
    const { student_id, name, email, year, section, subjects } = req.body;
    
    if (!student_id || !name || !year || !section) {
      return res.status(400).json({ error: 'Student ID, name, year, and section are required' });
    }

    // Check if student ID already exists in demo mode
    if (!isConnected) {
      const existingStudent = demoData.students.find(s => s.studentId === student_id);
      if (existingStudent) {
        return res.status(400).json({ error: 'Student ID already exists' });
      }
    }

    if (isConnected) {
      // MongoDB mode
      const Student = require('./models/Student');
      
      // Check if student already exists
      const existingStudent = await Student.findOne({ studentId: student_id });
      if (existingStudent) {
        return res.status(400).json({ error: 'Student ID already exists' });
      }
      
      const newStudent = new Student({ 
        studentId: student_id, 
        name, 
        email: email || `${student_id.toLowerCase()}@student.com`,
        course: 'General', // Default course since removed from form
        year: parseInt(year),
        section: section,
        subjects: subjects || [], // Array of subject IDs
        beaconId: `BEACON_${student_id}`,
        isActive: true
      });
      const savedStudent = await newStudent.save();
      res.status(201).json({ student: savedStudent });
    } else {
      // Demo mode
      const studentData = {
        studentId: student_id,
        name,
        email: email || `${student_id}@student.com`,
        course: 'General', // Default course since removed from form
        year: parseInt(year),
        section: section,
        subjects: subjects || [], // Array of subject IDs
        isActive: true,
        beaconId: `BEACON_${student_id}`
      };
      
      const result = await addData('students', studentData);
      res.status(201).json({ student: result.data });
    }
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(400).json({ error: 'Student ID already exists' });
    }
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student endpoint
app.put('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, name, email, year, section, subjects } = req.body;
    
    console.log(`Updating student with ID: ${id}`);
    console.log('Request body:', { student_id, name, email, year, section, subjects });
    
    if (!student_id || !name || !year || !section) {
      return res.status(400).json({ error: 'Student ID, name, year, and section are required' });
    }

    if (isConnected) {
      // MongoDB mode
      const Student = require('./models/Student');
      const mongoose = require('mongoose');
      
      // Check if ID is valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('Invalid ObjectId format:', id);
        return res.status(400).json({ error: 'Invalid student ID format' });
      }
      
      const updatedStudent = await Student.findByIdAndUpdate(
        id,
        {
          studentId: student_id,
          name,
          email: email || `${student_id.toLowerCase()}@student.com`,
          year: parseInt(year),
          section,
          subjects: subjects || [],
          updatedAt: new Date()
        },
        { new: true }
      );
      
      if (!updatedStudent) {
        console.log('Student not found in MongoDB:', id);
        return res.status(404).json({ error: 'Student not found' });
      }
      
      console.log('Student updated successfully:', updatedStudent._id);
      res.json({ student: updatedStudent });
    } else {
      // Demo mode
      const studentIndex = demoData.students.findIndex(s => s.id === id || s._id === id);
      
      if (studentIndex === -1) {
        console.log('Student not found in demo data:', id);
        return res.status(404).json({ error: 'Student not found' });
      }
      
      demoData.students[studentIndex] = {
        ...demoData.students[studentIndex],
        studentId: student_id,
        name,
        email: email || `${student_id}@student.com`,
        year: parseInt(year),
        section,
        subjects: subjects || [],
        updatedAt: new Date().toISOString()
      };
      
      console.log('Student updated in demo mode:', demoData.students[studentIndex]);
      res.json({ student: demoData.students[studentIndex] });
    }
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student endpoint
app.delete('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected) {
      // MongoDB mode
      const Student = require('./models/Student');
      const deletedStudent = await Student.findByIdAndDelete(id);
      
      if (!deletedStudent) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      res.json({ message: 'Student deleted successfully' });
    } else {
      // Demo mode
      const studentIndex = demoData.students.findIndex(s => s.id === id || s._id === id);
      
      if (studentIndex === -1) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      demoData.students.splice(studentIndex, 1);
      res.json({ message: 'Student deleted successfully' });
    }
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CRUD Operations for Classes
app.get('/api/classes', authenticateToken, async (req, res) => {
  try {
    let classes;
    
    if (isConnected) {
      // MongoDB mode - using Class model
      const Class = require('./models/Class');
      // If teacher is logged in, return only their classes
      if (req.user?.role === 'teacher') {
        classes = await Class.find({ teacher_id: req.user.id }).lean();
      } else {
        classes = await Class.find({}).lean();
      }
      return res.json(classes);
    } else {
      // Demo mode
      const teacherId = req.user?.id;
      const source = Array.isArray(demoData.classes) ? demoData.classes : [];
      classes = source
        .filter(cls => {
          // If teacher, only show their classes
          if (req.user?.role === 'teacher') {
            return (cls.teacher_id === teacherId) || (cls.teacher_id?.toString?.() === teacherId?.toString?.());
          }
          return true;
        })
        .map(cls => ({
        ...cls,
        teacher_name: demoData.teachers.find(t => t.id === cls.teacher_id)?.name || 'Demo Teacher'
      }));
    }
    
    // Calculate enrolled students count for each class
    const classesWithEnrollment = classes.map(cls => {
      const classId = cls._id || cls.id;
      const enrolledCount = demoData.students.filter(student => 
        student.subjects && student.subjects.some(subj => subj === classId || subj.toString() === classId)
      ).length;
      
      return {
        ...cls,
        enrolled_students: enrolledCount
      };
    });
    
    // Return the classes directly as an array to match MongoDB format
    return res.json(classesWithEnrollment.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enrolled students for a specific class
app.get('/api/classes/:id/students', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isConnected) {
      // MongoDB mode
      const Class = require('./models/Class');
      const Student = require('./models/Student');
      
      // Find the class by ID
      const classDoc = await Class.findById(id).lean();
      if (!classDoc) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      // Find students that have this class in their subjects array
      const students = await Student.find({ subjects: id }).lean();
      
      // Return formatted student data
      return res.json(students.map(student => ({
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        year: student.year,
        section: student.section
      })));
    } else {
      // Demo mode
      // Find the class
      const classItem = demoData.classes.find(c => c.id === id || c._id === id);
      if (!classItem) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      // Find students enrolled in this class
      const enrolledStudents = demoData.students.filter(student => 
        student.subjects && student.subjects.some(subj => subj === id || subj.toString() === id)
      );
      
      // Return formatted student data
      return res.json(enrolledStudents.map(student => ({
        id: student.id || student._id,
        name: student.name,
        email: student.email || '',
        studentId: student.studentId || student.student_id,
        year: student.year,
        section: student.section
      })));
    }
  } catch (error) {
    console.error('Get enrolled students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get student detail with classes and attendance
app.get('/api/admin/student/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    let student;
    if (isConnected) {
      const Student = require('./models/Student');
      const AttendanceModel = require('./models/Attendance');
      student = await Student.findById(id).lean();
      if (!student) return res.status(404).json({ error: 'Student not found' });

      // Fetch attendance for this student
      const attendanceDocs = await AttendanceModel.find({ studentId: student._id }).lean();
      const present = attendanceDocs.filter(a => a.status === 'present').length;
      const absent = attendanceDocs.filter(a => a.status === 'absent').length;
      const totalSessions = attendanceDocs.length;
      
      // Fetch classes for this student
      let classes = [];
      if (student.subjects && student.subjects.length > 0) {
        // Get class data from demo data since we don't have a Class model yet
        classes = (demoData.classes || []).filter(cls => 
          student.subjects.some(subjectId => 
            subjectId === cls._id || subjectId === cls.id
          )
        );
      }

      return res.json({
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          year: student.year,
          section: student.section
        },
        classes: classes.map(c => ({ id: c.id || c._id, name: c.name })),
        attendance: attendanceDocs.map(a => ({
          class_id: a.classId || a.class_id || '—',
          status: a.status,
          timestamp: a.date
        })),
        summary: { totalSessions, present, absent }
      });
    }

    // Demo mode
    const s = demoData.students.find(st => st.id === id || st._id === id || st.studentId === id);
    if (!s) return res.status(404).json({ error: 'Student not found' });

    const classes = (demoData.classes || []).filter(cls => Array.isArray(s.subjects) && s.subjects.includes(cls._id || cls.id));
    const attendance = (demoData.attendance || []).filter(a => a.student_id == (s.id || s._id));
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const totalSessions = attendance.length;

    res.json({
      student: {
        id: s.id || s._id,
        name: s.name,
        email: s.email,
        studentId: s.studentId || s.student_id,
        year: s.year,
        section: s.section
      },
      classes: classes.map(c => ({ id: c.id || c._id, name: c.name })),
      attendance,
      summary: { totalSessions, present, absent }
    });
  } catch (error) {
    console.error('Get student detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/classes', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    if (isConnected) {
      // MongoDB mode
      const Class = require('./models/Class');
      // Assign to the logged-in teacher when available
      let validTeacherId = req.user?.role === 'teacher' ? req.user.id : undefined;
      if (!validTeacherId) {
        const Teacher = require('./models/Teacher');
        const anyTeacher = await Teacher.find().limit(1);
        if (anyTeacher.length === 0) return res.status(400).json({ error: 'No teachers available' });
        validTeacherId = anyTeacher[0]._id;
      }
      
      const newClass = new Class({
        name,
        teacher_id: validTeacherId,
        students: []
      });
      const savedClass = await newClass.save();
      res.status(201).json({ class: savedClass });
    } else {
      // Demo mode
      const result = await addData('classes', { name, teacher_id: req.user.id });
      res.status(201).json({ class: result.data });
    }
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Attendance Management
app.post('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { student_id, class_id, beacon_id, status, location_data } = req.body;
    
    if (!student_id || !class_id || !status) {
      return res.status(400).json({ error: 'Student ID, class ID, and status are required' });
    }

    if (isConnected) {
      // MongoDB mode - TODO: Implement Attendance model
      const Attendance = require('./models/Attendance');
      const newAttendance = new Attendance({
        studentId: student_id,
        classId: class_id,
        beaconId: beacon_id,
        status,
        location: location_data
      });
      const savedAttendance = await newAttendance.save();
      res.status(201).json({ attendance: savedAttendance });
    } else {
      // Demo mode
      const result = await addData('attendance', { student_id, class_id, beacon_id, status, location_data });
      res.status(201).json({ attendance: result.data });
    }
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/attendance/:class_id', authenticateToken, async (req, res) => {
  try {
    const { class_id } = req.params;
    const { date } = req.query;

    if (isConnected) {
      // MongoDB mode - using demo data for now
      let attendance = demoData.attendance_logs.filter(log => log.class_id == class_id);
      if (date) {
        attendance = attendance.filter(log => log.timestamp.toDateString() === new Date(date).toDateString());
      }
      res.json({ attendance });
    } else {
      // Demo mode
      const attendance = demoData.attendance.filter(a => a.class_id == class_id);
      const attendanceWithNames = attendance.map(a => {
        const student = demoData.students.find(s => s.id == a.student_id);
        return {
          ...a,
          student_name: student?.name || 'Unknown Student',
          student_id: student?.student_id || 'Unknown'
        };
      });
      res.json({ attendance: attendanceWithNames });
    }
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Hardware-based Attendance System - Bluetooth Beacon Detection
// Students are automatically detected when they enter the classroom
// No manual registration or login needed


// Hardware-based attendance marking (via Bluetooth beacon)
app.post('/api/attendance/hardware', async (req, res) => {
  try {
    const { student_id, class_id, beacon_id, status, location_data } = req.body;
    
    if (!student_id || !class_id || !beacon_id) {
      return res.status(400).json({ error: 'Student ID, class ID, and beacon ID are required' });
    }

    // Verify beacon is valid for this class
    // In production, this would check against registered beacons
    
    if (isConnected) {
      // MongoDB mode - TODO: Implement Attendance model
      const Attendance = require('./models/Attendance');
      const newAttendance = new Attendance({
        studentId: student_id,
        classId: class_id,
        beaconId: beacon_id,
        status: status || 'present',
        location: location_data
      });
      const savedAttendance = await newAttendance.save();
      res.status(201).json({ attendance: savedAttendance });
    } else {
      // Demo mode
      const result = await addData('attendance', { student_id, class_id, beacon_id, status: status || 'present', location_data });
      res.status(201).json({ attendance: result.data });
    }
  } catch (error) {
    console.error('Hardware attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Attendance System API is running',
    mode: isConnected ? 'MongoDB Atlas' : 'Demo (In-Memory)',
    demoAccounts: !isConnected ? {
      admin: { email: 'admin@attendance.com', password: 'password123' },
      teacher: { email: 'demo@teacher.com', password: 'password123' }
    } : undefined,
    timestamp: new Date().toISOString()
  });
});

// Initialize Email APIs
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Nodemailer transporter
const nodemailerTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Debug email configuration
console.log('🔧 Resend API Key:', process.env.RESEND_API_KEY ? 'Set' : 'Missing');
console.log('🔧 Gmail User:', process.env.GMAIL_USER ? 'Set' : 'Missing');
console.log('🔧 Gmail App Password:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing');

// Password reset verification codes storage (in-memory for demo)
const resetCodes = {};

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email template generator
const generateEmailTemplate = (code, teacherName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Password Reset Request</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">Hello ${teacherName || 'User'},</p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">We received a request to reset your password for your Attendance System account.</p>
        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="color: #333; font-size: 14px; margin-bottom: 10px;">Your verification code is:</p>
          <h1 style="color: #007bff; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${code}</h1>
        </div>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">This code will expire in 30 minutes for security reasons.</p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">If you didn't request this password reset, please ignore this email or contact support.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 14px; text-align: center;">Attendance System Team</p>
      </div>
    </div>
  `;
};

// Send email using Resend API (Primary)
const sendEmailWithResend = async (email, code, teacherName) => {
  try {
    console.log(`📧 [RESEND] Attempting to send email to: ${email}`);
    
    const emailPayload = {
      from: 'Attendance System <onboarding@resend.dev>',
      to: [email],
      subject: 'Password Reset Verification Code - Attendance System',
      html: generateEmailTemplate(code, teacherName)
    };
    
    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('❌ [RESEND] API Error:', JSON.stringify(error, null, 2));
      throw new Error(`Resend API Error: ${JSON.stringify(error)}`);
    }

    console.log('✅ [RESEND] Email sent successfully:', data.id);
    return { success: true, provider: 'Resend', data };
  } catch (error) {
    console.error('❌ [RESEND] Failed:', error.message);
    throw error;
  }
};

// Send email using Nodemailer (Fallback)
const sendEmailWithNodemailer = async (email, code, teacherName) => {
  try {
    console.log(`📧 [NODEMAILER] Attempting to send email to: ${email}`);
    
    const mailOptions = {
      from: process.env.GMAIL_USER || 'attendance.system.noreply@gmail.com',
      to: email,
      subject: 'Password Reset Verification Code - Attendance System',
      html: generateEmailTemplate(code, teacherName)
    };
    
    const info = await nodemailerTransporter.sendMail(mailOptions);
    console.log('✅ [NODEMAILER] Email sent successfully:', info.messageId);
    return { success: true, provider: 'Nodemailer', data: info };
  } catch (error) {
    console.error('❌ [NODEMAILER] Failed:', error.message);
    throw error;
  }
};

// Dual email sending with fallback mechanism
const sendVerificationEmail = async (email, code, teacherName) => {
  const providers = [
    { name: 'Resend', func: sendEmailWithResend, available: !!process.env.RESEND_API_KEY },
    { name: 'Nodemailer', func: sendEmailWithNodemailer, available: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) }
  ];

  const availableProviders = providers.filter(p => p.available);
  
  if (availableProviders.length === 0) {
    throw new Error('No email providers configured. Please set up RESEND_API_KEY or Gmail credentials.');
  }

  console.log(`📧 Available email providers: ${availableProviders.map(p => p.name).join(', ')}`);

  for (const provider of availableProviders) {
    try {
      console.log(`🔄 Trying ${provider.name}...`);
      const result = await provider.func(email, code, teacherName);
      console.log(`✅ Email sent successfully via ${provider.name}`);
      return result;
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error.message);
      
      // If this is not the last provider, continue to next one
      if (provider !== availableProviders[availableProviders.length - 1]) {
        console.log(`🔄 Falling back to next email provider...`);
        continue;
      }
      
      // If all providers failed, throw the last error
      throw new Error(`All email providers failed. Last error: ${error.message}`);
    }
  }
};

// Welcome email template
const generateWelcomeTemplate = ({ name, role, email, plainPassword }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Welcome to Attendance System</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">Hello ${name || 'User'},</p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">Your ${role || 'user'} account has been created successfully.</p>
        <div style="background:#f7f9ff;border:1px solid #e5e9ff;padding:16px;border-radius:8px;">
          <p style="margin:8px 0;color:#333;"><strong>Email:</strong> ${email}</p>
          ${plainPassword ? `<p style="margin:8px 0;color:#333;"><strong>Temporary Password:</strong> ${plainPassword}</p>` : ''}
          <p style="margin:8px 0;color:#333;"><strong>Role:</strong> ${role}</p>
        </div>
        <p style="color:#888;font-size:12px;margin-top:16px;">For security, please change your password after first login.</p>
      </div>
    </div>
  `;
};

// Send welcome email (best-effort)
const sendWelcomeEmail = async ({ name, role, email, plainPassword }) => {
  const providers = [
    { name: 'Resend', available: !!process.env.RESEND_API_KEY, send: async () => {
      const payload = {
        from: 'Attendance System <onboarding@resend.dev>',
        to: [email],
        subject: 'Your account has been created',
        html: generateWelcomeTemplate({ name, role, email, plainPassword })
      };
      const { data, error } = await resend.emails.send(payload);
      if (error) throw new Error(JSON.stringify(error));
      return data;
    }},
    { name: 'Nodemailer', available: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD), send: async () => {
      const info = await nodemailerTransporter.sendMail({
        from: process.env.GMAIL_USER || 'attendance.system.noreply@gmail.com',
        to: email,
        subject: 'Your account has been created',
        html: generateWelcomeTemplate({ name, role, email, plainPassword })
      });
      return info;
    }}
  ];
  const usable = providers.filter(p => p.available);
  if (usable.length === 0) {
    console.log('✉️  No email providers configured. Skipping welcome email.');
    return { success: false, skipped: true };
  }
  for (const p of usable) {
    try {
      const result = await p.send();
      console.log(`✅ Welcome email sent via ${p.name}`);
      return { success: true, provider: p.name, result };
    } catch (e) {
      console.error(`❌ Welcome email via ${p.name} failed:`, e.message);
      // try next
    }
  }
  return { success: false };
};

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if teacher exists
    let teacher;
    if (isConnected) {
      teacher = await Teacher.findOne({ email });
    } else {
      const teachers = await getData('teachers');
      teacher = teachers.find(t => t.email === email);
    }
    
    if (!teacher) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // Check if there's already a recent request (rate limiting)
    const existingCode = resetCodes[email];
    if (existingCode && Date.now() < existingCode.expiresAt) {
      const remainingTime = Math.ceil((existingCode.expiresAt - Date.now()) / 60000);
      return res.status(429).json({ 
        error: `Please wait ${remainingTime} minutes before requesting a new code`
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store code with expiration (30 minutes)
    resetCodes[email] = {
      code: verificationCode,
      expiresAt: Date.now() + 30 * 60 * 1000,
      attempts: 0
    };

    // If no email providers configured, return code directly in demo/dev
    const providersConfigured = !!process.env.RESEND_API_KEY || (!!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD);
    if (!providersConfigured) {
      console.log('✉️  No email providers configured. Returning verification code in response for demo/dev.');
      return res.status(200).json({ message: 'Verification code generated (demo mode)', code: verificationCode, provider: 'demo' });
    }

    try {
      await sendVerificationEmail(email, verificationCode, teacher.name);
      console.log(`✅ Password reset email sent to ${email} with code: ${verificationCode}`);
      res.status(200).json({ message: 'Verification code sent to your email' });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      
      // Clear the stored code if email fails
      delete resetCodes[email];
      
      // Check if it's a rate limit error from Resend
      if (emailError.message && emailError.message.includes('rate')) {
        res.status(429).json({ 
          error: 'Too many email requests. Please wait a few minutes and try again.'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to send verification email. Please try again in a few minutes.'
        });
      }
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify reset code endpoint (separate from password reset)
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Verify the code
    const resetData = resetCodes[email];
    if (!resetData) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }

    if (resetData.code !== code) {
      // Increment failed attempts
      resetData.attempts = (resetData.attempts || 0) + 1;
      
      // Block after 3 failed attempts
      if (resetData.attempts >= 3) {
        delete resetCodes[email];
        return res.status(429).json({ error: 'Too many failed attempts. Please request a new verification code.' });
      }
      
      return res.status(400).json({ 
        error: `Invalid verification code. ${3 - resetData.attempts} attempts remaining.` 
      });
    }

    if (Date.now() > resetData.expiresAt) {
      delete resetCodes[email];
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Mark code as verified but don't delete it yet
    resetData.verified = true;
    resetData.verifiedAt = Date.now();

    res.status(200).json({ 
      message: 'Verification code confirmed. You can now reset your password.',
      verified: true 
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password endpoint (only works after code verification)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    // Verify the code and check if it was previously verified
    const resetData = resetCodes[email];
    if (!resetData) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }

    if (resetData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > resetData.expiresAt) {
      delete resetCodes[email];
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Check if code was previously verified
    if (!resetData.verified) {
      return res.status(400).json({ error: 'Please verify your code first before resetting password' });
    }

    // Check if verification is still valid (5 minutes after verification)
    if (Date.now() > resetData.verifiedAt + 5 * 60 * 1000) {
      delete resetCodes[email];
      return res.status(400).json({ error: 'Verification session expired. Please verify your code again.' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 12);
    
    if (isConnected) {
      await Teacher.findOneAndUpdate(
        { email },
        { password_hash: passwordHash, updatedAt: new Date() }
      );
    } else {
      // Demo mode
      const teachers = demoData.teachers;
      const teacherIndex = teachers.findIndex(t => t.email === email);
      
      if (teacherIndex !== -1) {
        teachers[teacherIndex].password_hash = passwordHash;
      }
    }

    // Clear the reset code
    delete resetCodes[email];

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Aayan's Attendance System API running on port ${PORT}`);
  console.log(`📊 ${isConnected ? 'MongoDB Atlas connected' : 'Demo mode with in-memory storage'}`);
  console.log(`🔒 Security features: Helmet, Rate Limiting, JWT Authentication`);
  console.log(`📈 Scalability: Rate limiting configured for high load handling`);
  if (!isConnected) {
    console.log(`👤 Demo account: demo@teacher.com / password123`);
  }
});


