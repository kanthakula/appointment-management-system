require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { nanoid } = require('nanoid');
const qrcode = require('qrcode');
const cron = require('cron');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const cors = require('cors');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname))
  }
});

// Configure multer for profile picture uploads
const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: logoStorage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const profilePicUpload = multer({ 
  storage: profilePicStorage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://localhost:3000',
      'https://localhost:3002',
      'https://192.168.1.102:3000',
      'https://192.168.1.102:3002',
      'http://192.168.1.102:3000',
      'http://192.168.1.102:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
      'https://127.0.0.1:3000',
      'https://127.0.0.1:3002'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Direct logout page
app.get('/logout', (req, res) => {
  console.log('Direct logout page accessed');
  
  // Clear all cookies
  res.clearCookie('token', { 
    httpOnly: true, 
    path: '/',
    secure: false,
    sameSite: 'lax'
  });
  
  res.clearCookie('token', { path: '/' });
  res.clearCookie('token', { path: '/admin' });
  res.clearCookie('token', { path: '/api' });
  
  // Send a simple HTML page that redirects
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Logging out...</title>
        <meta http-equiv="refresh" content="2;url=/">
    </head>
    <body>
        <h1>Logging out...</h1>
        <p>You will be redirected to the home page.</p>
        <script>
            localStorage.clear();
            sessionStorage.clear();
            setTimeout(() => {
                window.location.replace('/');
            }, 1000);
        </script>
    </body>
    </html>
  `);
});

// Serve React app static files
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const WHITELIST = (process.env.WHITELIST_DOMAINS || '').split(',').map(s=>s.trim()).filter(Boolean);

function hashPassword(password){
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}$${derived}`;
}

function verifyPassword(password, stored){
  if (!stored) return false;
  const [salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return derived === hash;
}

function issueToken(payload){
  return jwt.sign(payload, process.env.JWT_SECRET || 'devSecret', { expiresIn: '8h' });
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  
  console.log('Auth middleware - Token present:', !!token);
  console.log('Auth middleware - Cookies:', Object.keys(req.cookies || {}));
  
  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ error: 'No token provided', requiresLogin: true });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devSecret');
    req.user = payload;
    console.log('Auth middleware - Token valid for user:', payload.email);
    return next();
  } catch (e) {
    console.log('Auth middleware - Invalid token:', e.message);
    return res.status(401).json({ error: 'Invalid or expired token', requiresLogin: true });
  }
}

// Helper function to get user roles and permissions
async function getUserRolesAndPermissions(userId) {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });
  
  if (!userWithRoles) return { roles: [], permissions: [] };
  
  const roles = userWithRoles.userRoles.map(ur => ur.role.name);
  const permissions = userWithRoles.userRoles.flatMap(ur => ur.role.permissions);
  
  return { roles, permissions };
}

// Helper function to check if user has permission
async function hasPermission(userId, permission) {
  const { permissions } = await getUserRolesAndPermissions(userId);
  return permissions.includes(permission);
}

// Helper function to check if user has any of the specified roles
async function hasAnyRole(userId, roleNames) {
  const { roles } = await getUserRolesAndPermissions(userId);
  return roleNames.some(role => roles.includes(role));
}

function adminOnly(req,res,next){
  // Check legacy role field first for backward compatibility
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'checkin_user' || req.user.role === 'reporting')) {
    return next();
  }
  
  // For new multi-role system, we'll check permissions in the route handlers
  // This middleware now just ensures the user is authenticated
  if (req.user) {
    return next();
  }
  
  return res.status(403).json({ error: 'Admin access required' });
}

function superAdminOnly(req,res,next){
  if (req.user && (req.user.role === 'super_admin' || req.user.roles?.includes('super_admin'))) return next();
  return res.status(403).json({ error: 'Super admin access required' });
}

async function adminOrSuperAdminOnly(req,res,next){
  try {
    if (!req.user) {
      return res.status(403).json({ error: 'Admin or Super Admin access required' });
    }

    // Check legacy role first
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }

    // If no legacy role, fetch user roles from database
    const userWithRoles = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (userWithRoles && userWithRoles.userRoles) {
      const roles = userWithRoles.userRoles.map(ur => ur.role.name);
      if (roles.includes('admin') || roles.includes('super_admin')) {
        return next();
      }
    }

    return res.status(403).json({ error: 'Admin or Super Admin access required' });
  } catch (error) {
    console.error('Error in adminOrSuperAdminOnly middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function checkinUserOrHigher(req,res,next){
  if (req.user && (
    req.user.role === 'checkin_user' || req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'reporting' ||
    req.user.roles?.includes('checkin_user') || req.user.roles?.includes('admin') || req.user.roles?.includes('super_admin') || req.user.roles?.includes('reporting')
  )) return next();
  return res.status(403).json({ error: 'CheckIn User or higher access required' });
}

// email transport (fallback to console)
let mailer = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
  mailer = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

function sendEmail(to, subject, text, html) {
  if (!to) return Promise.resolve();
  const msg = { from: process.env.EMAIL_USER || 'no-reply@example.com', to, subject, text, html };
  if (!mailer) {
    console.log('[Email mock] To:', to, 'Subject:', subject);
    return Promise.resolve();
  }
  return mailer.sendMail(msg).then(r=>r).catch(err=>{console.error('Email error', err)});
}

function sendSMS(phone, text) {
  // stub: in prod use Twilio or similar
  if (!phone) return Promise.resolve();
  console.log('[SMS mock] To:', phone, text);
  return Promise.resolve();
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cookies: Object.keys(req.cookies || {}),
    hasCookieHeader: !!req.headers.cookie
  });
});

// Theme/Config API
app.get('/api/config/theme', async (req, res) => {
  try {
    let config = await prisma.organizationConfig.findFirst();
    if (!config) {
      // Create default config if none exists
      config = await prisma.organizationConfig.create({
        data: {
          organizationName: 'DarshanFlow',
          primaryColor: '#4F46E5',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          backgroundColor: '#F9FAFB',
          textColor: '#111827',
          timezone: 'America/Chicago',
          maxAttendees: 5,
          waitlistPercentage: 10
        }
      });
    }
    res.json(config);
  } catch (error) {
    console.error('Theme fetch error:', error);
    res.status(500).json({ error: 'Failed to load theme' });
  }
});

app.put('/api/config/theme', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { organizationName, primaryColor, secondaryColor, accentColor, backgroundColor, textColor, timezone, emailWhitelist, allowUserRegistration, maxAttendees, waitlistPercentage } = req.body;
    
    // Parse maxAttendees and waitlistPercentage as integers
    const parsedMaxAttendees = maxAttendees !== undefined ? parseInt(maxAttendees, 10) : undefined;
    const parsedWaitlistPercentage = waitlistPercentage !== undefined ? parseInt(waitlistPercentage, 10) : undefined;
    
    let config = await prisma.organizationConfig.findFirst();
    if (!config) {
      config = await prisma.organizationConfig.create({
        data: {
          organizationName: organizationName || 'DarshanFlow',
          primaryColor: primaryColor || '#4F46E5',
          secondaryColor: secondaryColor || '#10B981',
          accentColor: accentColor || '#F59E0B',
          backgroundColor: backgroundColor || '#F9FAFB',
          textColor: textColor || '#111827',
          timezone: timezone || 'America/Chicago',
          emailWhitelist: emailWhitelist || null,
          allowUserRegistration: allowUserRegistration !== undefined ? allowUserRegistration : false,
          maxAttendees: parsedMaxAttendees !== undefined ? parsedMaxAttendees : 5,
          waitlistPercentage: parsedWaitlistPercentage !== undefined ? parsedWaitlistPercentage : 10
        }
      });
    } else {
      // Build update data object, only including fields that are provided
      const updateData = {};
      if (organizationName !== undefined) updateData.organizationName = organizationName;
      if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
      if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
      if (accentColor !== undefined) updateData.accentColor = accentColor;
      if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
      if (textColor !== undefined) updateData.textColor = textColor;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (emailWhitelist !== undefined) updateData.emailWhitelist = emailWhitelist;
      if (allowUserRegistration !== undefined) updateData.allowUserRegistration = allowUserRegistration;
      if (parsedMaxAttendees !== undefined) updateData.maxAttendees = parsedMaxAttendees;
      if (parsedWaitlistPercentage !== undefined) {
        updateData.waitlistPercentage = parsedWaitlistPercentage;
        console.log(`Updating waitlistPercentage to: ${parsedWaitlistPercentage}`);
      }
      
      config = await prisma.organizationConfig.update({
        where: { id: config.id },
        data: updateData
      });
      
      console.log(`Config updated. waitlistPercentage is now: ${config.waitlistPercentage}`);
    }
    
    // Fetch updated config to return
    const updatedConfig = await prisma.organizationConfig.findFirst();
    console.log(`Returning config with waitlistPercentage: ${updatedConfig?.waitlistPercentage}`);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Theme update error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

app.post('/api/config/logo', authMiddleware, adminOnly, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    
    let config = await prisma.organizationConfig.findFirst();
    if (!config) {
      config = await prisma.organizationConfig.create({
        data: {
          organizationName: 'DarshanFlow',
          logo: logoUrl,
          primaryColor: '#4F46E5',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          backgroundColor: '#F9FAFB',
          textColor: '#111827',
          timezone: 'America/Chicago'
        }
      });
    } else {
      config = await prisma.organizationConfig.update({
        where: { id: config.id },
        data: { logo: logoUrl }
      });
    }
    
    res.json({ logo: logoUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Auth API
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get roles and permissions
    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = user.userRoles.flatMap(ur => ur.role.permissions);
    
    // Return user data with roles and permissions
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role, // Legacy field for backward compatibility
      profilePic: user.profilePic,
      roles: roles,
      permissions: permissions,
      roleDetails: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
        description: ur.role.description,
        permissions: ur.role.permissions
      }))
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                description: true,
                permissions: true
              }
            }
          }
        }
      }
    });
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!verifyPassword(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = issueToken({ id: user.id, email: user.email, role: user.role || 'user' });
    res.cookie('token', token, { 
      httpOnly: true, 
      path: '/',
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours in milliseconds
    });
    
    // Get roles and permissions
    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = user.userRoles.flatMap(ur => ur.role.permissions);
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role, // Legacy field for backward compatibility
      profilePic: user.profilePic,
      roles: roles,
      permissions: permissions,
      roleDetails: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
        description: ur.role.description,
        permissions: ur.role.permissions
      }))
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  console.log('Logout request received');
  console.log('Current cookies:', req.cookies);
  
  // Clear the token cookie with exact same options as it was set
  res.clearCookie('token', { 
    httpOnly: true, 
    path: '/',
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax'
  });
  
  // Also try clearing with different options in case the cookie was set differently
  res.clearCookie('token', { path: '/' });
  res.clearCookie('token', { path: '/admin' });
  res.clearCookie('token', { path: '/api' });
  res.clearCookie('token'); // Try with no options
  
  // Set the token to an expired value as a fallback
  res.cookie('token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
    secure: false,
    sameSite: 'lax'
  });
  
  console.log('All cookies cleared, sending response');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// Additional endpoint to clear all cookies (emergency logout)
app.post('/api/auth/clear-all-cookies', (req, res) => {
  console.log('Clear all cookies request received');
  
  // Clear all possible cookies
  const cookieNames = ['token', 'session', 'auth', 'user'];
  const paths = ['/', '/admin', '/api', '/login'];
  
  cookieNames.forEach(name => {
    // Try clearing with all possible path combinations
    paths.forEach(path => {
      res.clearCookie(name, { path });
      res.clearCookie(name, { path, httpOnly: true });
      res.clearCookie(name, { path, secure: false });
      res.clearCookie(name, { path, sameSite: 'lax' });
      res.clearCookie(name, { 
        path, 
        httpOnly: true, 
        secure: false, 
        sameSite: 'lax' 
      });
    });
    
    // Also try with no options
    res.clearCookie(name);
    
    // Set to expired value as fallback
    res.cookie(name, '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true
    });
  });
  
  console.log('All cookies cleared');
  res.status(200).json({ success: true, message: 'All cookies cleared' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    
  const hash = hashPassword(password);
    const user = await prisma.user.create({ 
      data: { 
        email, 
        name: name || 'User', 
        phone: phone || null, 
        password: hash, 
        role: 'user' 
      } 
    });
    
    const token = issueToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('token', token, { 
      httpOnly: true,
      path: '/',
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours in milliseconds
    });
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Timeslots API
app.get('/api/timeslots', async (req, res) => {
  try {
    const slots = await prisma.timeslot.findMany({ 
      where: { 
        published: true,
        archived: false  // Exclude archived slots from public booking
      }, 
      orderBy: [{ date: 'asc' }, { start: 'asc' }]
    });
    
    // Get config for waitlist percentage
    const config = await prisma.organizationConfig.findFirst();
    const waitlistPercentage = config?.waitlistPercentage ?? 10;
    
    // Add waitlist information to each slot
    const slotsWithWaitlist = await Promise.all(slots.map(async (slot) => {
      // Calculate waitlist capacity
      const waitlistCapacity = Math.floor((slot.capacity * waitlistPercentage) / 100);
      // Ensure at least 1 entry if percentage > 0
      const finalCapacity = waitlistPercentage > 0 && waitlistCapacity === 0 && (slot.capacity * waitlistPercentage / 100) > 0 
        ? 1 
        : waitlistCapacity;
      
      // Get current waitlist count - use a fresh query to ensure accuracy
      const waitlistCount = await prisma.waitlistEntry.count({
        where: { timeslotId: slot.id }
      });
      
      return {
        ...slot,
        waitlistCount,
        waitlistCapacity: finalCapacity,
        waitlistFull: waitlistCount >= finalCapacity
      };
    }));
    
    res.json(slotsWithWaitlist);
  } catch (error) {
    console.error('Timeslots API error:', error);
    res.status(500).json({ error: 'Failed to load timeslots' });
  }
});

app.get('/api/timeslots/:id', async (req, res) => {
  try {
    const timeslot = await prisma.timeslot.findUnique({ 
      where: { 
        id: req.params.id,
        published: true,
        archived: false  // Exclude archived slots
      } 
    });
    if (!timeslot) return res.status(404).json({ error: 'Timeslot not found' });
    res.json(timeslot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load timeslot' });
  }
});

// Registration API
app.post('/api/register/:timeslotId', async (req, res) => {
  try {
    const { name, email, phone, recurring, partySize } = req.body;
    let partySizeNum = parseInt(partySize || '1', 10) || 1;
    if (partySizeNum < 1) partySizeNum = 1;
    
    // Get maxAttendees from organization config
    const config = await prisma.organizationConfig.findFirst();
    const maxAttendees = config?.maxAttendees || 5;
    
    if (partySizeNum > maxAttendees) return res.status(400).json({ error: `Maximum ${maxAttendees} people allowed per reservation` });
    
    const timeslotId = req.params.timeslotId;

    // whitelist check
  if (WHITELIST.length > 0 && email) {
    const domain = email.split('@')[1];
    if (!WHITELIST.includes(domain)) {
        return res.status(400).json({ error: 'Email domain not allowed' });
    }
  }

  // Helper to detect retryable serialization errors from Postgres
  function isRetryableError(err) {
    if (!err) return false;
    const msg = (err.message || '').toLowerCase();
    return msg.includes('could not serialize') || msg.includes('deadlock') || msg.includes('serialization failure') || (err.code && err.code === '40001');
  }

  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Atomically decrement remaining by partySize if available
          const updated = await tx.$queryRaw`UPDATE "Timeslot" SET remaining = remaining - ${partySizeNum} WHERE id = ${timeslotId} AND remaining >= ${partySizeNum} RETURNING *`;
        const timeslot = updated && updated[0];
        if (!timeslot) throw Object.assign(new Error('Timeslot full or not found'), { status: 400 });

          // find or create user within transaction
        let user = null;
        if (email) user = await tx.user.findUnique({ where: { email } });
        if (!user && phone) user = await tx.user.findFirst({ where: { phone } });
        if (!user && recurring) {
          user = await tx.user.create({ data: { email: email || null, name, phone: phone || null, recurring: recurring ? true : false } });
        }

        const reg = await tx.registration.create({ 
          data: { 
            timeslotId: timeslot.id, 
            userId: user?.id || null,
            fullName: name,
            email: email || '',
            phone: phone || '',
            method: 'online', 
              partySize: partySizeNum
          } 
        });
        return { reg, timeslot, user };
      });

      // on success generate QR and send notifications outside the transaction
      const { reg, timeslot, user } = result;
      const qr = await qrcode.toDataURL(JSON.stringify({ registrationId: reg.id }));
      const message = `Your booking for ${timeslot.date.toISOString().slice(0,10)} ${timeslot.start} is confirmed.`;
        await Promise.all([ 
          sendEmail(email, 'Booking confirmed', message, `<p>${message}</p><img src="${qr}"/>`), 
          sendSMS(phone, message) 
        ]).catch(()=>{});
        
        return res.json({ 
          registrationId: reg.id, 
          qr,
          timeslot: {
            date: timeslot.date,
            start: timeslot.start,
            end: timeslot.end
          }
        });
    } catch (err) {
      if (err && err.status) {
          return res.status(err.status).json({ error: err.message });
      }
      if (isRetryableError(err) && attempt < maxRetries - 1) {
        console.log('Transaction serialization error, retrying...', attempt, err.message?.slice(0,200));
        await new Promise(r => setTimeout(r, 50 * (attempt+1)));
        continue;
      }
      console.error('Registration error', err);
        return res.status(500).json({ error: 'Internal error' });
      }
    }
    return res.status(500).json({ error: 'Could not process registration' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Check-in API
app.post('/api/checkin/qr', async (req, res) => {
  try {
    const { data } = req.body;
  let parsed;
    try { parsed = JSON.parse(data); } catch(e) { return res.status(400).json({ error: 'Invalid QR' }); }
    
  const reg = await prisma.registration.findUnique({ where: { id: parsed.registrationId } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    
  await prisma.registration.update({ where: { id: reg.id }, data: { checkedIn: true } });
    
  const timeslot = reg.timeslotId ? await prisma.timeslot.findUnique({ where: { id: reg.timeslotId } }) : null;
  const user = await prisma.user.findUnique({ where: { id: reg.userId } });
    
    res.json({ 
      ok: true, 
      reg: Object.assign({}, reg, { 
        date: timeslot?.date, 
        start: timeslot?.start, 
        name: user?.name, 
        phone: user?.phone 
      }) 
    });
  } catch (error) {
    res.status(500).json({ error: 'Check-in failed' });
  }
});

app.post('/api/checkin/search', async (req, res) => {
  try {
    const { q } = req.body;
    
    // Search for registrations by name, email, or phone
    let regs = await prisma.registration.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } }
        ],
        checkedIn: false // Only find unchecked-in registrations
      },
      include: {
        timeslot: {
          select: {
            id: true,
            date: true,
            start: true,
            end: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!regs || regs.length === 0) {
      return res.status(404).json({ error: 'No registration found' });
    }
    
    // Get the most recent registration
    const reg = regs[0];
    
    // Check if the registration is for today or future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reg.timeslot && reg.timeslot.date < today) {
      return res.status(400).json({ error: 'This registration is for a past event' });
    }
    
    // Return registration details without checking in
    res.json({ 
      found: true, 
      reg: {
        id: reg.id,
        name: reg.fullName,
        email: reg.email,
        phone: reg.phone,
        partySize: reg.partySize,
        date: reg.timeslot?.date,
        start: reg.timeslot?.start,
        end: reg.timeslot?.end
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// New endpoint to perform the actual check-in
app.post('/api/checkin/confirm', async (req, res) => {
  try {
    const { registrationId, actualCheckInCount } = req.body;
    
    // Get the registration
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        timeslot: {
          select: {
            id: true,
            date: true,
            start: true,
            end: true
          }
        }
      }
    });
    
    if (!reg) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    // Validate check-in count
    if (actualCheckInCount > reg.partySize) {
      return res.status(400).json({ 
        error: `Cannot check in more people than originally booked. Maximum allowed: ${reg.partySize}` 
      });
    }
    
    if (actualCheckInCount <= 0) {
      return res.status(400).json({ 
        error: 'Check-in count must be at least 1' 
      });
    }
    
    // Check if already checked in
    if (reg.checkedIn) {
      return res.status(400).json({ 
        error: 'This registration has already been checked in' 
      });
    }
    
    // Update the registration as checked in
    await prisma.registration.update({ 
      where: { id: reg.id }, 
      data: { 
        checkedIn: true,
        actualCheckInCount: actualCheckInCount
      } 
    });
    
    // Update timeslot remaining capacity (add back the difference between party size and actual check-in)
    const capacityToAdjust = reg.partySize - actualCheckInCount;
    if (capacityToAdjust > 0 && reg.timeslot) {
      await prisma.timeslot.update({
        where: { id: reg.timeslotId },
        data: {
          remaining: {
            increment: capacityToAdjust
          }
        }
      });
    }
    
    res.json({ 
      success: true, 
      reg: {
        id: reg.id,
        name: reg.fullName,
        email: reg.email,
        phone: reg.phone,
        partySize: reg.partySize,
        actualCheckInCount: actualCheckInCount,
        date: reg.timeslot?.date,
        start: reg.timeslot?.start,
        end: reg.timeslot?.end
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// Admin API
app.get('/api/admin/timeslots', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { archived, archivedBy } = req.query;
    
    // Build where clause based on query parameters
    let whereClause = {};
    
    if (archived !== undefined) {
      whereClause.archived = archived === 'true';
    }
    
    if (archivedBy) {
      whereClause.archivedBy = archivedBy;
    }
    
    const slots = await prisma.timeslot.findMany({ 
      where: whereClause,
      include: {
        registrations: {
          select: {
            id: true,
            checkedIn: true,
            partySize: true,
            actualCheckInCount: true
          }
        },
        waitlistEntries: {
          select: {
            id: true,
            partySize: true
          }
        }
      },
      orderBy: [{ date: 'asc' }, { start: 'asc' }] 
    });
    
    // Get config for waitlist percentage
    const config = await prisma.organizationConfig.findFirst();
    const waitlistPercentage = config?.waitlistPercentage ?? 10;
    
    // Calculate check-in statistics and waitlist info for each slot
    const slotsWithStats = await Promise.all(slots.map(async (slot) => {
      const totalBookings = slot.registrations.length;
      const totalCheckedIn = slot.registrations.filter(reg => reg.checkedIn).length;
      const totalPeopleBooked = slot.registrations.reduce((sum, reg) => sum + reg.partySize, 0);
      const totalPeopleCheckedIn = slot.registrations
        .filter(reg => reg.checkedIn)
        .reduce((sum, reg) => sum + (reg.actualCheckInCount || reg.partySize), 0);
      
      // Calculate waitlist capacity
      const waitlistCapacity = Math.floor((slot.capacity * waitlistPercentage) / 100);
      const finalWaitlistCapacity = waitlistPercentage > 0 && waitlistCapacity === 0 && (slot.capacity * waitlistPercentage / 100) > 0 
        ? 1 
        : waitlistCapacity;
      
      // Get waitlist count and people
      const waitlistCount = slot.waitlistEntries?.length || 0;
      const waitlistPeople = slot.waitlistEntries?.reduce((sum, entry) => sum + entry.partySize, 0) || 0;
      
      return {
        ...slot,
        stats: {
          totalBookings,
          totalCheckedIn,
          totalPeopleBooked,
          totalPeopleCheckedIn,
          checkInRate: totalBookings > 0 ? ((totalCheckedIn / totalBookings) * 100).toFixed(1) : 0
        },
        waitlist: {
          count: waitlistCount,
          capacity: finalWaitlistCapacity,
          people: waitlistPeople,
          full: waitlistCount >= finalWaitlistCapacity
        }
      };
    }));
    
    res.json(slotsWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load timeslots' });
  }
});

app.get('/api/admin/timeslots/archived', authMiddleware, adminOnly, async (req, res) => {
  try {
    const slots = await prisma.timeslot.findMany({ 
      where: { archived: true },
      orderBy: [{ date: 'desc' }, { start: 'asc' }] 
    });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load archived timeslots' });
  }
});

app.post('/api/admin/timeslots', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { 
      date, 
      start, 
      end, 
      capacity, 
      publish,
      autoPublishEnabled,
      autoPublishType,
      autoPublishDateTime,
      autoPublishHoursBefore
    } = req.body;
    const cap = parseInt(capacity||'1',10);
    
    // Fix date handling to avoid timezone issues
    const dateParts = date.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2]);
    const correctDate = new Date(year, month, day);
    
    // If trying to publish, check if the slot date is in the past using timezone-aware comparison
    if (publish) {
      if (await isPastDateInUserTimezone(correctDate, start)) {
        return res.status(400).json({ 
          error: 'Cannot create published timeslots for past dates. Only future-dated slots can be published.' 
        });
      }
    }
    
    // Prepare auto-publishing data
    const autoPublishData = {};
    if (autoPublishEnabled) {
      autoPublishData.autoPublishEnabled = true;
      autoPublishData.autoPublishType = autoPublishType;
      
      if (autoPublishType === 'scheduled' && autoPublishDateTime) {
        autoPublishData.autoPublishDateTime = new Date(autoPublishDateTime);
      } else if (autoPublishType === 'hours_before' && autoPublishHoursBefore) {
        autoPublishData.autoPublishHoursBefore = parseInt(autoPublishHoursBefore);
      }
    }
    
    const timeslot = await prisma.timeslot.create({ 
      data: { 
        date: correctDate, 
        start, 
        end: end||'', 
        capacity: cap, 
        remaining: cap, 
        published: publish ? true : false, 
        createdBy: req.user.id,
        ...autoPublishData
      } 
    });
    
    // Log the action
    const autoPublishInfo = autoPublishEnabled ? 
      ` (Auto-publish: ${autoPublishType === 'scheduled' ? autoPublishDateTime : `${autoPublishHoursBefore}h before`})` : '';
    
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_TIMESLOT',
        details: `Created timeslot: ${correctDate.toISOString().slice(0,10)} ${start}-${end||'N/A'} (Capacity: ${cap}) ${publish ? 'Published' : 'Draft'}${autoPublishInfo}`,
        performedBy: req.user.id
      }
    });
    
    res.json(timeslot);
  } catch (error) {
    console.error('Error creating timeslot:', error);
    res.status(500).json({ error: 'Failed to create timeslot' });
  }
});

app.put('/api/admin/timeslots/:id/publish', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { publish } = req.body;
    
    // Get timeslot details for validation and logging
    const existingTimeslot = await prisma.timeslot.findUnique({
      where: { id: req.params.id },
      select: { date: true, start: true, end: true, archived: true }
    });

    if (!existingTimeslot) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }

    // Check if slot is archived - archived slots cannot be published
    if (publish && existingTimeslot.archived) {
      return res.status(400).json({ 
        error: 'Cannot publish archived slots. Please restore the slot first.' 
      });
    }

    // If trying to publish, check if the slot date is in the past using timezone-aware comparison
    if (publish) {
      if (await isPastDateInUserTimezone(existingTimeslot.date, existingTimeslot.start)) {
        return res.status(400).json({ 
          error: 'Cannot publish timeslots from past dates. Only future-dated slots can be published.' 
        });
      }
    }
    
    // Update data: if publishing, also unarchive the slot
    const updateData = { published: publish };
    if (publish) {
      updateData.archived = false; // Automatically unarchive when publishing
    }
    
    const timeslot = await prisma.timeslot.update({ 
      where: { id: req.params.id }, 
      data: updateData
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: publish ? 'PUBLISH_TIMESLOT' : 'UNPUBLISH_TIMESLOT',
        details: `${publish ? 'Published' : 'Unpublished'} timeslot: ${existingTimeslot.date.toISOString().slice(0,10)} ${existingTimeslot.start}-${existingTimeslot.end||'N/A'}`,
        performedBy: req.user.id
      }
    });
    
    res.json(timeslot);
  } catch (error) {
    console.error('Publish timeslot error:', error);
    res.status(500).json({ error: 'Failed to update timeslot' });
  }
});

app.put('/api/admin/timeslots/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { 
      date, 
      start, 
      end, 
      capacity, 
      publish,
      autoPublishEnabled,
      autoPublishType,
      autoPublishDateTime,
      autoPublishHoursBefore
    } = req.body;
    const cap = parseInt(capacity || '1', 10);
    
    // Fix date handling to avoid timezone issues
    const dateParts = date.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2]);
    const correctDate = new Date(year, month, day);
    
    // Get the existing timeslot to check its status
    const existingTimeslot = await prisma.timeslot.findUnique({
      where: { id: req.params.id },
      include: {
        registrations: {
          select: { id: true }
        },
        waitlistEntries: {
          select: { id: true }
        }
      }
    });
    
    if (!existingTimeslot) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }
    
    // Check if this is an archived slot with bookings/waitlist being moved to future date
    const hasBookings = existingTimeslot.registrations.length > 0;
    const hasWaitlist = existingTimeslot.waitlistEntries.length > 0;
    const isArchived = existingTimeslot.archived;
    const isMovingToFuture = !(await isPastDateInUserTimezone(correctDate, start));
    const originalDate = new Date(existingTimeslot.date);
    const isDateChanging = originalDate.toISOString().split('T')[0] !== correctDate.toISOString().split('T')[0];
    
    // If archived slot with bookings/waitlist is being moved to future, create a copy instead
    if (isArchived && (hasBookings || hasWaitlist) && isMovingToFuture && isDateChanging) {
      // Create a new copy of the slot with the new date
      const autoPublishData = {};
      if (autoPublishEnabled) {
        autoPublishData.autoPublishEnabled = true;
        autoPublishData.autoPublishType = autoPublishType;
        if (autoPublishType === 'scheduled' && autoPublishDateTime) {
          autoPublishData.autoPublishDateTime = new Date(autoPublishDateTime);
        } else if (autoPublishType === 'hours_before' && autoPublishHoursBefore) {
          autoPublishData.autoPublishHoursBefore = parseInt(autoPublishHoursBefore);
        }
      } else {
        autoPublishData.autoPublishEnabled = false;
        autoPublishData.autoPublishType = null;
        autoPublishData.autoPublishDateTime = null;
        autoPublishData.autoPublishHoursBefore = null;
      }
      
      const newTimeslot = await prisma.timeslot.create({
        data: {
          date: correctDate,
          start,
          end: end || '',
          capacity: cap,
          remaining: cap, // Reset count for new slot
          published: publish ? true : false,
          archived: false, // New slot is not archived
          archivedBy: null,
          ...autoPublishData
        }
      });
      
      // Log the copy action
      await prisma.auditLog.create({
        data: {
          action: 'COPY_TIMESLOT',
          details: `Created copy of archived timeslot (ID: ${existingTimeslot.id}) to future date: ${correctDate.toISOString().slice(0,10)} ${start}-${end||'N/A'}. Original slot preserved with ${hasBookings ? existingTimeslot.registrations.length + ' bookings' : ''}${hasBookings && hasWaitlist ? ' and ' : ''}${hasWaitlist ? existingTimeslot.waitlistEntries.length + ' waitlist entries' : ''} for reporting.`,
          performedBy: req.user.id
        }
      });
      
      return res.json({
        ...newTimeslot,
        isCopy: true,
        originalSlotId: existingTimeslot.id,
        message: `Slot copied successfully. Original archived slot preserved with ${hasBookings ? existingTimeslot.registrations.length + ' bookings' : ''}${hasBookings && hasWaitlist ? ' and ' : ''}${hasWaitlist ? existingTimeslot.waitlistEntries.length + ' waitlist entries' : ''} for reporting.`
      });
    }
    
    // If trying to publish, check if the slot date is in the past using timezone-aware comparison
    if (publish) {
      if (await isPastDateInUserTimezone(correctDate, start)) {
        return res.status(400).json({ 
          error: 'Cannot publish timeslots from past dates. Only future-dated slots can be published.' 
        });
      }
    }
    
    // Prepare auto-publishing data
    const autoPublishData = {};
    if (autoPublishEnabled) {
      autoPublishData.autoPublishEnabled = true;
      autoPublishData.autoPublishType = autoPublishType;
      
      if (autoPublishType === 'scheduled' && autoPublishDateTime) {
        autoPublishData.autoPublishDateTime = new Date(autoPublishDateTime);
      } else if (autoPublishType === 'hours_before' && autoPublishHoursBefore) {
        autoPublishData.autoPublishHoursBefore = parseInt(autoPublishHoursBefore);
      }
    } else {
      // Clear auto-publishing data if disabled
      autoPublishData.autoPublishEnabled = false;
      autoPublishData.autoPublishType = null;
      autoPublishData.autoPublishDateTime = null;
      autoPublishData.autoPublishHoursBefore = null;
    }
    
    const timeslot = await prisma.timeslot.update({ 
      where: { id: req.params.id }, 
      data: { 
        date: correctDate, 
        start, 
        end: end || '', 
        capacity: cap, 
        remaining: cap, 
        published: publish ? true : false,
        ...autoPublishData
      } 
    });
    
    // Log the action
    const autoPublishInfo = autoPublishEnabled ? 
      ` (Auto-publish: ${autoPublishType === 'scheduled' ? autoPublishDateTime : `${autoPublishHoursBefore}h before`})` : '';
    
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_TIMESLOT',
        details: `Updated timeslot: ${correctDate.toISOString().slice(0,10)} ${start}-${end||'N/A'} (Capacity: ${cap}) ${publish ? 'Published' : 'Draft'}${autoPublishInfo}`,
        performedBy: req.user.id
      }
    });
    
    res.json(timeslot);
  } catch (error) {
    console.error('Error updating timeslot:', error);
    res.status(500).json({ error: 'Failed to update timeslot' });
  }
});

app.put('/api/admin/timeslots/:id/archive', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Get timeslot details for logging
    const existingTimeslot = await prisma.timeslot.findUnique({
      where: { id: req.params.id },
      select: { date: true, start: true, end: true }
    });
    
    const timeslot = await prisma.timeslot.update({ 
      where: { id: req.params.id }, 
      data: { archived: true, published: false, archivedBy: req.user.id } 
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'ARCHIVE_TIMESLOT',
        details: `Archived timeslot: ${existingTimeslot.date.toISOString().slice(0,10)} ${existingTimeslot.start}-${existingTimeslot.end||'N/A'}`,
        performedBy: req.user.id
      }
    });
    
    res.json(timeslot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive timeslot' });
  }
});

// Registration API for end-users
app.post('/api/registrations', async (req, res) => {
  try {
    const { fullName, email, phone, partySize, timeslotId, recurringVisitor } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !phone || !timeslotId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate partySize against maxAttendees config
    const partySizeNum = parseInt(partySize) || 1;
    const config = await prisma.organizationConfig.findFirst();
    const maxAttendees = config?.maxAttendees || 5;
    
    if (partySizeNum > maxAttendees) {
      return res.status(400).json({ error: `Maximum ${maxAttendees} people allowed per reservation` });
    }

    // Check if timeslot exists and has capacity
    const timeslot = await prisma.timeslot.findUnique({ where: { id: timeslotId } });
    if (!timeslot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    if (!timeslot.published) {
      return res.status(400).json({ error: 'This time slot is not available for booking' });
    }

    if (timeslot.archived) {
      return res.status(400).json({ error: 'This time slot is no longer available for booking' });
    }

    if (timeslot.remaining < partySize) {
      return res.status(400).json({ error: 'Not enough capacity for this booking' });
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        fullName,
        email,
        phone,
        partySize: parseInt(partySize) || 1,
        timeslotId,
        method: 'online'
      }
    });

    // Update timeslot capacity
    const updatedTimeslot = await prisma.timeslot.update({
      where: { id: timeslotId },
      data: { remaining: timeslot.remaining - parseInt(partySize) },
      select: { remaining: true }
    });

    // If recurring visitor, create/update user record
    if (recurringVisitor) {
      await prisma.user.upsert({
        where: { email },
        update: { 
          name: fullName, 
          phone, 
          recurring: true 
        },
        create: {
          email,
          name: fullName,
          phone,
          recurring: true,
          role: 'user'
        }
      });
    }

    res.status(201).json(registration);
    
    // Trigger waitlist promotion check (async, don't wait)
    promoteFromWaitlist(timeslotId, updatedTimeslot.remaining).catch(err => {
      console.error('Waitlist promotion error:', err);
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create registration' });
  }
});

// ============================================
// WAITLIST MANAGEMENT ENDPOINTS
// ============================================

// Helper function to calculate waitlist capacity
async function getWaitlistCapacity(timeslotId) {
  const timeslot = await prisma.timeslot.findUnique({ where: { id: timeslotId } });
  if (!timeslot) return 0;
  
  const config = await prisma.organizationConfig.findFirst();
  // Use nullish coalescing to handle null/undefined, default to 10
  const waitlistPercentage = config?.waitlistPercentage ?? 10;
  
  // Calculate waitlist capacity: percentage of total capacity
  // For small capacities, ensure at least 1 entry if percentage > 0
  const calculated = (timeslot.capacity * waitlistPercentage) / 100;
  const capacity = Math.floor(calculated);
  
  // If percentage > 0 and capacity is 0 but calculated > 0, allow at least 1
  if (waitlistPercentage > 0 && capacity === 0 && calculated > 0) {
    return 1;
  }
  
  return capacity;
}

// Helper function to promote waitlist entries when slots become available
async function promoteFromWaitlist(timeslotId, availableSpots) {
  if (availableSpots <= 0) return { promoted: 0, entries: [] };
  
  const config = await prisma.organizationConfig.findFirst();
  const maxAttendees = config?.maxAttendees || 5;
  
  // Get waitlist entries ordered by position (first come, first served)
  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where: {
      timeslotId,
      notified: false
    },
    orderBy: {
      position: 'asc'
    }
  });
  
  let spotsUsed = 0;
  const promotedEntries = [];
  
  for (const entry of waitlistEntries) {
    if (spotsUsed + entry.partySize > availableSpots) break;
    if (entry.partySize > maxAttendees) continue; // Skip if party size exceeds limit
    
    try {
      // Create registration for this waitlist entry
      const registration = await prisma.registration.create({
        data: {
          fullName: entry.fullName,
          email: entry.email,
          phone: entry.phone,
          partySize: entry.partySize,
          timeslotId: entry.timeslotId,
          method: 'waitlist_promoted'
        }
      });
      
      // Mark waitlist entry as notified and processed
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { notified: true }
      });
      
      // Delete waitlist entry
      await prisma.waitlistEntry.delete({
        where: { id: entry.id }
      });
      
      // Update timeslot remaining
      const timeslot = await prisma.timeslot.findUnique({ where: { id: timeslotId } });
      await prisma.timeslot.update({
        where: { id: timeslotId },
        data: { remaining: timeslot.remaining - entry.partySize }
      });
      
      spotsUsed += entry.partySize;
      promotedEntries.push({ ...registration, originalWaitlistEntry: entry });
      
      // Send notification email
      const message = `Great news! A spot has become available for your waitlisted appointment on ${new Date(timeslot.date).toLocaleDateString()} at ${timeslot.start}. Your booking is now confirmed!`;
      await sendEmail(entry.email, 'Waitlist Promotion - Booking Confirmed', message, `<p>${message}</p>`).catch(() => {});
      
    } catch (error) {
      console.error(`Failed to promote waitlist entry ${entry.id}:`, error);
      // Continue with next entry even if one fails
    }
  }
  
  return { promoted: promotedEntries.length, entries: promotedEntries };
}

// Add to Waitlist
// POST /api/waitlist/:timeslotId
app.post('/api/waitlist/:timeslotId', async (req, res) => {
  try {
    const { fullName, email, phone, partySize } = req.body;
    const { timeslotId } = req.params;
    
    // Validate required fields
    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: 'Full name, email, and phone are required' });
    }
    
    const partySizeNum = parseInt(partySize) || 1;
    const config = await prisma.organizationConfig.findFirst();
    const maxAttendees = config?.maxAttendees || 5;
    
    if (partySizeNum > maxAttendees) {
      return res.status(400).json({ error: `Maximum ${maxAttendees} people allowed per waitlist entry` });
    }
    
    // Check if timeslot exists
    const timeslot = await prisma.timeslot.findUnique({ where: { id: timeslotId } });
    if (!timeslot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    if (!timeslot.published || timeslot.archived) {
      return res.status(400).json({ error: 'This time slot is not available for waitlist' });
    }
    
    // Check if slot is actually full (remaining should be 0 or less)
    if (timeslot.remaining > 0) {
      return res.status(400).json({ 
        error: 'This slot still has availability. Please book directly instead of waitlist.' 
      });
    }
    
    // Calculate waitlist capacity
    const waitlistCapacity = await getWaitlistCapacity(timeslotId);
    
    // Get current waitlist count - use a fresh query to ensure accuracy
    const currentWaitlistCount = await prisma.waitlistEntry.count({
      where: { timeslotId }
    });
    
    // Get waitlist percentage for error message
    const waitlistPercentage = config?.waitlistPercentage ?? 10;
    
    // Debug logging
    console.log(`[Waitlist] Slot ${timeslotId.substring(0, 8)}: Current count: ${currentWaitlistCount}, Capacity: ${waitlistCapacity}, Trying to add: ${partySizeNum} people`);
    
    // Check if waitlist is full
    if (currentWaitlistCount >= waitlistCapacity) {
      return res.status(400).json({ 
        error: `Waitlist is full. Maximum ${waitlistCapacity} entries allowed (${waitlistPercentage}% of capacity).` 
      });
    }
    
    // Check if user already exists in waitlist for this slot
    const existingEntry = await prisma.waitlistEntry.findFirst({
      where: {
        timeslotId,
        email: email
      }
    });
    
    if (existingEntry) {
      return res.status(400).json({ 
        error: 'You are already on the waitlist for this slot.' 
      });
    }
    
    // Get next position in waitlist
    const maxPosition = await prisma.waitlistEntry.aggregate({
      where: { timeslotId },
      _max: { position: true }
    });
    const nextPosition = (maxPosition._max.position || 0) + 1;
    
    // Create waitlist entry
    const waitlistEntry = await prisma.waitlistEntry.create({
      data: {
        timeslotId,
        fullName,
        email,
        phone,
        partySize: partySizeNum,
        position: nextPosition
      }
    });
    
    // Get updated count after creation to ensure accuracy
    // Use a small delay to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const updatedWaitlistCount = await prisma.waitlistEntry.count({
      where: { timeslotId }
    });
    
    console.log(`[Waitlist] After creation: Slot ${timeslotId.substring(0, 8)}, New count: ${updatedWaitlistCount}, Position: ${nextPosition}`);
    
    res.status(201).json({
      ...waitlistEntry,
      waitlistPosition: nextPosition,
      totalWaitlistCapacity: waitlistCapacity,
      currentWaitlistCount: updatedWaitlistCount,
      message: `You've been added to the waitlist at position ${nextPosition}. We'll notify you if a spot becomes available.`
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: 'Failed to add to waitlist' });
  }
});

// Get Waitlist for a Slot (Admin only)
// GET /api/admin/waitlist/:timeslotId
app.get('/api/admin/waitlist/:timeslotId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { timeslotId } = req.params;
    
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: { timeslotId },
      orderBy: { position: 'asc' }
    });
    
    const timeslot = await prisma.timeslot.findUnique({ where: { id: timeslotId } });
    const waitlistCapacity = await getWaitlistCapacity(timeslotId);
    
    res.json({
      entries: waitlistEntries,
      totalCount: waitlistEntries.length,
      capacity: waitlistCapacity,
      remaining: waitlistCapacity - waitlistEntries.length,
      slotCapacity: timeslot?.capacity || 0,
      slotRemaining: timeslot?.remaining || 0
    });
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

// Get User's Waitlist Status
// GET /api/waitlist/status?email=user@example.com
app.get('/api/waitlist/status', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: { email },
      include: {
        timeslot: {
          select: {
            id: true,
            date: true,
            start: true,
            end: true,
            capacity: true,
            remaining: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      entries: waitlistEntries,
      count: waitlistEntries.length
    });
  } catch (error) {
    console.error('Get waitlist status error:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist status' });
  }
});

// Remove from Waitlist (User)
// DELETE /api/waitlist/:entryId
app.delete('/api/waitlist/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { email } = req.body;
    
    const entry = await prisma.waitlistEntry.findUnique({ where: { id: entryId } });
    
    if (!entry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }
    
    // Verify ownership (optional security check)
    if (email && entry.email !== email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await prisma.waitlistEntry.delete({ where: { id: entryId } });
    
    res.json({ message: 'Removed from waitlist successfully' });
  } catch (error) {
    console.error('Remove from waitlist error:', error);
    res.status(500).json({ error: 'Failed to remove from waitlist' });
  }
});

app.put('/api/admin/timeslots/:id/restore', authMiddleware, adminOnly, async (req, res) => {
  try {
    // First, get the timeslot to check its date
    const existingTimeslot = await prisma.timeslot.findUnique({
      where: { id: req.params.id }
    });

    if (!existingTimeslot) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }

    if (!existingTimeslot.archived) {
      return res.status(400).json({ error: 'Timeslot is not archived' });
    }

    // Check if the slot date is in the past
    const slotDate = new Date(existingTimeslot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    slotDate.setHours(0, 0, 0, 0); // Start of slot date

    const isPastDate = slotDate < today;

    // Restore the timeslot - always restore to Draft status (unpublished)
    const timeslot = await prisma.timeslot.update({ 
      where: { id: req.params.id }, 
      data: { 
        archived: false,
        published: false // Always restore as Draft (unpublished)
      } 
    });

    // Log the restore action
    try {
      await prisma.auditLog.create({
        data: {
          action: 'RESTORE_TIMESLOT',
          details: `Restored timeslot: ${timeslot.date.toISOString().slice(0,10)} ${timeslot.start}-${timeslot.end||'N/A'} (restored as Draft${isPastDate ? ' - Past date' : ''})`,
          performedBy: req.user.id
        }
      });
    } catch (logError) {
      console.error('Error logging restore action:', logError);
    }

    res.json({
      ...timeslot,
      restoredAsDraft: true,
      isPastDate: isPastDate,
      message: isPastDate ? 'Restored as Draft (past date - cannot be published)' : 'Restored as Draft'
    });
  } catch (error) {
    console.error('Restore timeslot error:', error);
    res.status(500).json({ error: 'Failed to restore timeslot' });
  }
});

// Get checked-in registrations for a specific timeslot
app.get('/api/admin/timeslots/:id/checked-in', authMiddleware, adminOnly, async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: {
        timeslotId: req.params.id,
        checkedIn: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        partySize: true,
        actualCheckInCount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load checked-in registrations' });
  }
});

app.delete('/api/admin/timeslots/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Check if there are any registrations for this timeslot
    const registrations = await prisma.registration.findMany({
      where: { timeslotId: req.params.id }
    });

    if (registrations.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete timeslot with existing registrations. Archive it instead.' 
      });
    }

    // Get timeslot details for logging before deletion
    const existingTimeslot = await prisma.timeslot.findUnique({
      where: { id: req.params.id },
      select: { date: true, start: true, end: true }
    });

    const timeslot = await prisma.timeslot.delete({ 
      where: { id: req.params.id } 
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_TIMESLOT',
        details: `Deleted timeslot: ${existingTimeslot.date.toISOString().slice(0,10)} ${existingTimeslot.start}-${existingTimeslot.end||'N/A'}`,
        performedBy: req.user.id
      }
    });
    
    res.json(timeslot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete timeslot' });
  }
});

app.get('/api/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [totalSlots, publishedSlots, totalBookings, totalCheckIns, totalWaitlistEntries] = await Promise.all([
      prisma.timeslot.count({ where: { archived: false } }), // Only count non-archived slots
      prisma.timeslot.count({ where: { published: true, archived: false } }),
      prisma.registration.count(),
      prisma.registration.count({ where: { checkedIn: true } }),
      prisma.waitlistEntry.count()
    ]);
    
    // Calculate total checked-in capacity (total people who actually checked in)
    const checkedInRegistrations = await prisma.registration.findMany({
      where: { checkedIn: true },
      select: { actualCheckInCount: true, partySize: true }
    });
    
    const totalCheckedInCapacity = checkedInRegistrations.reduce((sum, reg) => {
      return sum + (reg.actualCheckInCount || reg.partySize);
    }, 0);
    
    // Calculate total waitlist capacity and people on waitlist
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      select: { partySize: true }
    });
    
    const totalWaitlistPeople = waitlistEntries.reduce((sum, entry) => {
      return sum + entry.partySize;
    }, 0);
    
    res.json({
      totalSlots,
      publishedSlots,
      totalBookings,
      totalCheckIns,
      totalCheckedInCapacity,
      totalWaitlistEntries,
      totalWaitlistPeople
    });
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Get recent activity (bookings and check-ins)
app.get('/api/admin/recent-activity', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Get recent bookings (last 10)
    const recentBookings = await prisma.registration.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        timeslot: {
          select: {
            id: true,
            date: true,
            start: true,
            end: true
          }
        }
      }
    });

    // Get recent check-ins (last 10)
    const recentCheckIns = await prisma.registration.findMany({
      where: { checkedIn: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        timeslot: {
          select: {
            id: true,
            date: true,
            start: true,
            end: true
          }
        }
      }
    });

    res.json({
      recentBookings,
      recentCheckIns
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load recent activity' });
  }
});

// Get all available roles
app.get('/api/admin/roles', authMiddleware, adminOnly, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { displayName: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to load roles' });
  }
});

// Admin User Management API
app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'super_admin' },
          { role: 'checkin_user' },
          { role: 'reporting' }
        ]
      },
      include: {
        createdByUser: {
          select: {
            name: true,
            email: true
          }
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                description: true,
                permissions: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to load admin users' });
  }
});

app.post('/api/admin/users', authMiddleware, adminOrSuperAdminOnly, async (req, res) => {
  try {
    const { name, email, phone, password, roles } = req.body; // Changed from 'role' to 'roles' (array)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Validate roles array
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'At least one role must be specified' });
    }
    
    // Check if all roles exist in the database
    const existingRoles = await prisma.role.findMany({
      where: { name: { in: roles } }
    });
    
    if (existingRoles.length !== roles.length) {
      return res.status(400).json({ error: 'One or more specified roles do not exist' });
    }
    
    // Check permissions for each role assignment
    const currentUserPermissions = await getUserRolesAndPermissions(req.user.id);
    
    for (const roleName of roles) {
      if (roleName === 'super_admin' && !currentUserPermissions.permissions.includes('create_super_admin')) {
        return res.status(403).json({ error: 'Only super admins can create other super admins' });
      }
      if (roleName === 'admin' && !currentUserPermissions.permissions.includes('create_admin') && !currentUserPermissions.permissions.includes('manage_users')) {
        return res.status(403).json({ error: 'Insufficient permissions to create admin users' });
      }
      if (roleName === 'checkin_user' && !currentUserPermissions.permissions.includes('create_checkin_user') && !currentUserPermissions.permissions.includes('manage_users')) {
        return res.status(403).json({ error: 'Insufficient permissions to create checkin users' });
      }
      if (roleName === 'reporting' && !currentUserPermissions.permissions.includes('create_reporting_user') && !currentUserPermissions.permissions.includes('manage_users')) {
        return res.status(403).json({ error: 'Insufficient permissions to create reporting users' });
      }
    }
    
    const hashedPassword = hashPassword(password);
    
    // Create user with legacy role field (use first role for backward compatibility)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: roles[0], // Legacy field - use first role
        createdBy: req.user.id,
        active: true
      }
    });
    
    // Assign all roles to the user
    for (const roleName of roles) {
      const role = existingRoles.find(r => r.name === roleName);
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedBy: req.user.id
        }
      });
    }
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_USER',
        details: `Created user with roles [${roles.join(', ')}]: ${name} (${email})`,
        performedBy: req.user.id,
        performedOn: user.id
      }
    });
    
    // Return user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    res.status(201).json(userWithRoles);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/admin/users/:id', authMiddleware, adminOrSuperAdminOnly, async (req, res) => {
  try {
    const { name, email, phone, password, roles } = req.body; // Changed from 'role' to 'roles'
    const userId = req.params.id;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is being changed and if it's already taken
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Validate roles array
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'At least one role must be selected' });
    }
    
    // Get all available roles
    const allRoles = await prisma.role.findMany();
    const existingRoles = allRoles.map(r => r.name);
    
    // Validate that all provided roles exist
    for (const roleName of roles) {
      if (!existingRoles.includes(roleName)) {
        return res.status(400).json({ error: `Invalid role: ${roleName}` });
      }
    }
    
    // Check permissions for role assignments
    const currentUserPermissions = await getUserRolesAndPermissions(req.user.id);
    
    // Get existing user roles to compare what's being added vs removed
    const existingUserRoles = existingUser.userRoles.map(ur => ur.role.name);
    const rolesBeingAdded = roles.filter(role => !existingUserRoles.includes(role));
    const rolesBeingRemoved = existingUserRoles.filter(role => !roles.includes(role));
    
    console.log('Role update analysis:', {
      currentUser: req.user.email,
      targetUser: existingUser.email,
      existingRoles: existingUserRoles,
      newRoles: roles,
      rolesBeingAdded,
      rolesBeingRemoved
    });
    
    // Check permissions for roles being added (not removed)
    for (const roleName of rolesBeingAdded) {
      if (roleName === 'super_admin' && !currentUserPermissions.permissions.includes('create_super_admin')) {
        return res.status(403).json({ error: 'Only super admins can assign super admin roles' });
      }
      if (roleName === 'admin' && !currentUserPermissions.permissions.includes('create_admin') && !currentUserPermissions.permissions.includes('manage_users')) {
        return res.status(403).json({ error: 'Insufficient permissions to assign admin roles' });
      }
      if (roleName === 'checkin_user' && !currentUserPermissions.permissions.includes('create_checkin_user') && !currentUserPermissions.permissions.includes('manage_users')) {
        return res.status(403).json({ error: 'Insufficient permissions to assign checkin user roles' });
      }
      if (roleName === 'reporting' && !currentUserPermissions.permissions.includes('create_reporting_user') && !currentUserPermissions.permissions.includes('manage_users')) {
        return res.status(403).json({ error: 'Insufficient permissions to assign reporting roles' });
      }
    }
    
    // Check if user has general permission to manage users
    if (!currentUserPermissions.permissions.includes('manage_users') && 
        !currentUserPermissions.permissions.includes('create_admin') && 
        !currentUserPermissions.permissions.includes('create_checkin_user') && 
        !currentUserPermissions.permissions.includes('create_reporting_user') &&
        !currentUserPermissions.permissions.includes('create_super_admin')) {
      return res.status(403).json({ error: 'Admin or Super Admin access required' });
    }
    
    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      role: roles[0] // Legacy field - use first role for backward compatibility
    };
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      const salt = crypto.randomBytes(16).toString('hex');
      const derived = crypto.scryptSync(password, salt, 64).toString('hex');
      updateData.password = `${salt}$${derived}`;
    }
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    // Remove all existing role assignments
    await prisma.userRole.deleteMany({
      where: { userId: userId }
    });
    
    // Assign new roles
    for (const roleName of roles) {
      const role = allRoles.find(r => r.name === roleName);
      await prisma.userRole.create({
        data: {
          userId: userId,
          roleId: role.id,
          assignedBy: req.user.id
        }
      });
    }
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_ADMIN',
        details: `Updated admin user: ${updatedUser.name} (${updatedUser.email}) with roles: ${roles.join(', ')}`,
        performedBy: req.user.id,
        performedOn: userId
      }
    });
    
    // Fetch updated user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    res.json({
      id: userWithRoles.id,
      name: userWithRoles.name,
      email: userWithRoles.email,
      phone: userWithRoles.phone,
      role: userWithRoles.role, // Legacy field
      active: userWithRoles.active,
      createdAt: userWithRoles.createdAt,
      userRoles: userWithRoles.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
        description: ur.role.description,
        permissions: ur.role.permissions
      }))
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update admin user' });
  }
});

app.put('/api/admin/users/:id/toggle-active', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { active } = req.body;
    const userId = req.params.id;
    
    // Prevent deactivating yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, role: true }
    });
    
  if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only super admins can deactivate other super admins
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can deactivate other super admins' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { active }
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: active ? 'ACTIVATE_ADMIN' : 'DEACTIVATE_ADMIN',
        details: `${active ? 'Activated' : 'Deactivated'} ${user.role} user: ${user.name} (${user.email})`,
        performedBy: req.user.id,
        performedOn: userId
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get audit logs
app.get('/api/admin/audit-logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to last 100 entries
    });
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

// Debug endpoint to check current user (temporary)
app.get('/api/debug/current-user', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user,
      role: req.user?.role,
      isSuperAdmin: req.user?.role === 'super_admin'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile picture upload endpoint
app.post('/api/user/profile-pic', authMiddleware, profilePicUpload.single('profilePic'), async (req, res) => {
  try {
    console.log('Profile picture upload request received');
    console.log('User:', req.user?.email);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Update user profile picture
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePic: `/uploads/${req.file.filename}` }
    });

    console.log('Profile picture updated successfully:', updatedUser.profilePic);

    res.json({ 
      success: true, 
      profilePic: updatedUser.profilePic,
      message: 'Profile picture updated successfully' 
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});


app.get('/api/admin/bookings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { search, searchField, date, status } = req.query;
    
    // Build where clause for filtering
    const whereClause = {};
    
    // Search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      if (searchField === 'name' || !searchField) {
        whereClause.fullName = {
          contains: searchTerm,
          mode: 'insensitive'
        };
      } else if (searchField === 'email') {
        whereClause.email = {
          contains: searchTerm,
          mode: 'insensitive'
        };
      } else if (searchField === 'phone') {
        whereClause.phone = {
          contains: searchTerm,
          mode: 'insensitive'
        };
      } else if (searchField === 'all') {
        whereClause.OR = [
          {
            fullName: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            phone: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ];
      }
    }
    
    // Date filter (timezone-safe)
    if (date) {
      // Parse the date string to avoid timezone issues
      const dateParts = date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
      const day = parseInt(dateParts[2]);
      const filterDate = new Date(year, month, day);
      
      // Create date range for the entire day
      const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
      
      whereClause.timeslot = {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
    }
    
    // Status filter (checked-in status)
    if (status && status !== 'all') {
      if (status === 'checked-in') {
        whereClause.checkedIn = true;
      } else if (status === 'not-checked-in') {
        whereClause.checkedIn = false;
      }
    }
    
    const bookings = await prisma.registration.findMany({
      where: whereClause,
      include: {
        timeslot: {
          select: {
            id: true,
            date: true,
            start: true,
            end: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

app.put('/api/admin/bookings/:id/checkin', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { actualCheckInCount } = req.body;
    
    // Get the registration with timeslot info to check the original party size
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      select: { 
        partySize: true,
        timeslotId: true,
        checkedIn: true,
        actualCheckInCount: true,
        fullName: true,
        email: true,
        timeslot: {
          select: {
            date: true,
            start: true,
            end: true
          }
        }
      }
    });
    
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    // Validate that actualCheckInCount doesn't exceed party size
    if (actualCheckInCount && actualCheckInCount > registration.partySize) {
      return res.status(400).json({ 
        error: `Cannot check in more people than originally booked. Maximum allowed: ${registration.partySize}` 
      });
    }
    
    const checkInCount = actualCheckInCount || registration.partySize;
    
    // Use transaction to ensure atomicity of check-in and capacity adjustment
    const result = await prisma.$transaction(async (tx) => {
      // Update the booking
      const updatedBooking = await tx.registration.update({
        where: { id: req.params.id },
        data: { 
          checkedIn: true,
          actualCheckInCount: checkInCount
        }
      });

      // Calculate capacity adjustment
      let capacityToAdjust = 0;
      
      if (registration.checkedIn) {
        // If this is a re-check-in (updating existing check-in), calculate the difference
        const previousCheckInCount = registration.actualCheckInCount || registration.partySize;
        capacityToAdjust = previousCheckInCount - checkInCount;
      } else {
        // If this is a new check-in, add back the difference between party size and actual check-in
        capacityToAdjust = registration.partySize - checkInCount;
      }

      // Adjust timeslot capacity if needed
      if (capacityToAdjust !== 0) {
        await tx.timeslot.update({
          where: { id: registration.timeslotId },
          data: {
            remaining: {
              increment: capacityToAdjust
            }
          }
        });
      }

      return updatedBooking;
    });
    
    // Log the check-in action
    await prisma.auditLog.create({
      data: {
        action: 'CHECKIN_ATTENDEE',
        details: `Checked in ${registration.fullName} (${registration.email}) for ${registration.timeslot.date.toISOString().slice(0,10)} ${registration.timeslot.start}-${registration.timeslot.end||'N/A'} - ${checkInCount}/${registration.partySize} people`,
        performedBy: req.user.id,
        performedOn: req.params.id
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to update check-in status' });
  }
});

// Get registration details for confirmation page
app.get('/api/registrations/:id', async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      include: {
        timeslot: {
          select: {
            id: true,
            date: true,
            start: true,
            end: true
          }
        }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registration details' });
  }
});

// Generate QR code for registration
app.get('/api/registrations/:id/qr', async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      select: { id: true, fullName: true, email: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Generate QR code data
    const qrData = {
      id: registration.id,
      name: registration.fullName,
      email: registration.email,
      timestamp: new Date().toISOString()
    };

    // Generate QR code using the qrcode package
    const qrCodeDataURL = await qrcode.toDataURL(JSON.stringify(qrData), {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({ qrCode: qrCodeDataURL });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Auto-publish scheduler
const publishCron = new cron.CronJob('0 0 * * *', async ()=>{
  console.log('Auto-publish job running');
  const rows = await prisma.timeslot.findMany({ where: { published: false } });
  const today = new Date();
  for (const r of rows) {
    const d = new Date(r.date);
    const diff = (d - today)/(1000*60*60*24);
    if (diff >=0 && diff <= 7) {
      await prisma.timeslot.update({ where: { id: r.id }, data: { published: true } });
      console.log('Published', r.id);
    }
  }
});
publishCron.start();

// Reminder cron
const remindCron = new cron.CronJob('0 * * * *', async ()=>{
  console.log('Reminder job running');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  const dateStr = tomorrow.toISOString().slice(0,10);
  const times = await prisma.timeslot.findMany({ where: { date: new Date(dateStr) } });
  for (const t of times) {
    const regs = await prisma.registration.findMany({ where: { timeslotId: t.id } });
    for (const r of regs) {
      const u = await prisma.user.findUnique({ where: { id: r.userId } });
      const message = `Reminder: you have a booking on ${t.date.toISOString().slice(0,10)} ${t.start}`;
      sendEmail(u?.email, 'Reminder', message);
      sendSMS(u?.phone, message);
    }
  }
});
remindCron.start();

// Auto-publishing cron job - runs every 5 minutes
const autoPublishCron = new cron.CronJob('*/5 * * * *', async () => {
  console.log('Auto-publish job running');
  
  try {
    const now = new Date();
    
    // Find slots that need to be auto-published
    const slotsToPublish = await prisma.timeslot.findMany({
      where: {
        autoPublishEnabled: true,
        published: false,
        autoPublished: false,
        OR: [
          // Scheduled publishing
          {
            autoPublishType: 'scheduled',
            autoPublishDateTime: {
              lte: now
            }
          },
          // Hours before publishing
          {
            autoPublishType: 'hours_before',
            autoPublishHoursBefore: {
              not: null
            }
          }
        ]
      }
    });
    
    for (const slot of slotsToPublish) {
      let shouldPublish = false;
      
      if (slot.autoPublishType === 'scheduled') {
        // Check if scheduled time has passed
        if (slot.autoPublishDateTime && new Date(slot.autoPublishDateTime) <= now) {
          shouldPublish = true;
        }
      } else if (slot.autoPublishType === 'hours_before') {
        // Calculate when the slot should be published
        const slotDateTime = new Date(slot.date);
        const [hours, minutes] = slot.start.split(':').map(Number);
        slotDateTime.setHours(hours, minutes, 0, 0);
        
        const publishTime = new Date(slotDateTime.getTime() - (slot.autoPublishHoursBefore * 60 * 60 * 1000));
        
        if (publishTime <= now) {
          shouldPublish = true;
        }
      }
      
      if (shouldPublish) {
        // Publish the slot
        await prisma.timeslot.update({
          where: { id: slot.id },
          data: {
            published: true,
            autoPublished: true
          }
        });
        
        // Log the auto-publishing action as system action (no user)
        try {
          await prisma.auditLog.create({
            data: {
              action: 'AUTO_PUBLISH_TIMESLOT',
              details: `Auto-published timeslot: ${slot.date.toISOString().slice(0,10)} ${slot.start}-${slot.end||'N/A'} (${slot.autoPublishType === 'scheduled' ? 'Scheduled' : `${slot.autoPublishHoursBefore}h before`})`,
              performedBy: null // System action - no user
            }
          });
        } catch (logError) {
          console.error('Error logging auto-publish action:', logError);
        }
        
        console.log(`Auto-published slot ${slot.id}: ${slot.date.toISOString().slice(0,10)} ${slot.start}`);
      }
    }
  } catch (error) {
    console.error('Error in auto-publish job:', error);
  }
});
autoPublishCron.start();

// Auto-archiving cron job - runs every hour to archive slots past their date
const autoArchiveCron = new cron.CronJob('0 * * * *', async () => {
  console.log('Auto-archive job running');
  
  try {
    console.log(`Auto-archive: Checking for slots with timezone awareness`);
    
    // Get all non-archived slots and check them individually
    const allSlots = await prisma.timeslot.findMany({
      where: {
        archived: false
      }
    });
    
    const slotsToArchive = [];
    for (const slot of allSlots) {
      if (await isPastDateInUserTimezone(slot.date, slot.start)) {
        slotsToArchive.push(slot);
      }
    }
    
    console.log(`Found ${slotsToArchive.length} slots to archive (both published and unpublished)`);
    
    // Log details of slots found
    for (const slot of slotsToArchive) {
      console.log(`Slot to archive: ${slot.id} - Date: ${slot.date.toISOString().slice(0,10)}, Published: ${slot.published}, Archived: ${slot.archived}`);
    }
    
    for (const slot of slotsToArchive) {
      // Archive the slot and unpublish it
      await prisma.timeslot.update({
        where: { id: slot.id },
        data: {
          archived: true,
          published: false,
          archivedBy: 'system'
        }
      });
      
      // Log the auto-archiving action as system action (no user)
      try {
        await prisma.auditLog.create({
          data: {
            action: 'AUTO_ARCHIVE_TIMESLOT',
            details: `Auto-archived timeslot: ${slot.date.toISOString().slice(0,10)} ${slot.start}-${slot.end||'N/A'} (Past date, was ${slot.published ? 'published' : 'unpublished'})`,
            performedBy: null // System action - no user
          }
        });
      } catch (logError) {
        console.error('Error logging auto-archive action:', logError);
      }
      
      console.log(`Auto-archived slot ${slot.id}: ${slot.date.toISOString().slice(0,10)} ${slot.start} (was ${slot.published ? 'published' : 'unpublished'})`);
    }
    
    if (slotsToArchive.length > 0) {
      console.log(`Auto-archived ${slotsToArchive.length} slots (both published and unpublished)`);
    } else {
      console.log('No slots found to auto-archive');
    }
  } catch (error) {
    console.error('Error in auto-archive job:', error);
  }
});
autoArchiveCron.start();

// Helper function to get user's timezone-aware date comparison
async function isPastDateInUserTimezone(slotDate, slotStartTime = null, userTimezone = null) {
  try {
    const now = new Date();
    
    // If no user timezone provided, get organization timezone from database
    if (!userTimezone) {
      const orgConfig = await prisma.organizationConfig.findFirst();
      userTimezone = orgConfig?.timezone || 'America/Chicago';
    }
    
    // Get current time in user's timezone
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // Create slot datetime by combining date and start time
    let slotDateTime;
    if (slotStartTime) {
      // Parse the start time (e.g., "08:05")
      const [hours, minutes] = slotStartTime.split(':').map(Number);
      
      // Create slot datetime in user's timezone
      const slotDateInUserTz = new Date(slotDate.toLocaleString('en-US', { timeZone: userTimezone }));
      slotDateTime = new Date(slotDateInUserTz.getFullYear(), slotDateInUserTz.getMonth(), slotDateInUserTz.getDate(), hours, minutes);
    } else {
      // If no start time provided, use the date as-is
      slotDateTime = new Date(slotDate.toLocaleString('en-US', { timeZone: userTimezone }));
    }
    
    // Get just the date parts (year, month, day) in user's timezone
    const userToday = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate());
    const userSlotDay = new Date(slotDateTime.getFullYear(), slotDateTime.getMonth(), slotDateTime.getDate());
    
    // Check if the slot date is before today
    if (userSlotDay < userToday) {
      console.log(`Timezone check (${userTimezone}): Slot date ${userSlotDay.toISOString().slice(0,10)} is before today ${userToday.toISOString().slice(0,10)}`);
      return true;
    }
    
    // If it's the same date, check if it's past the current time
    if (userSlotDay.getTime() === userToday.getTime()) {
      const currentTime = userNow.getHours() * 60 + userNow.getMinutes();
      const slotTime = slotDateTime.getHours() * 60 + slotDateTime.getMinutes();
      
      console.log(`Timezone check (${userTimezone}): Same date ${userSlotDay.toISOString().slice(0,10)}, Current time: ${currentTime} (${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2,'0')}), Slot time: ${slotTime} (${Math.floor(slotTime/60)}:${(slotTime%60).toString().padStart(2,'0')}), IsPast: ${slotTime < currentTime}`);
      return slotTime < currentTime;
    }
    
    console.log(`Timezone check (${userTimezone}): Slot date ${userSlotDay.toISOString().slice(0,10)} is in the future`);
    return false;
  } catch (error) {
    console.error('Error in timezone comparison:', error);
    // Fallback to server timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDay = new Date(slotDate);
    slotDay.setHours(0, 0, 0, 0);
    return slotDay < today;
  }
}

// Startup check: Archive any existing published past-dated slots
async function startupArchiveCheck() {
  try {
    console.log('=== Startup: Checking for published past-dated slots ===');
    
    // Get all published slots and check them individually with timezone awareness
    const publishedSlots = await prisma.timeslot.findMany({
      where: {
        published: true,
        archived: false
      }
    });
    
    const pastDatedSlots = [];
    for (const slot of publishedSlots) {
      if (await isPastDateInUserTimezone(slot.date, slot.start)) {
        pastDatedSlots.push(slot);
      }
    }
    
    if (pastDatedSlots.length > 0) {
      console.log(`Found ${pastDatedSlots.length} published past-dated slots to archive immediately`);
      
      for (const slot of pastDatedSlots) {
        await prisma.timeslot.update({
          where: { id: slot.id },
          data: {
            archived: true,
            published: false,
            archivedBy: 'system'
          }
        });
        
        console.log(`Archived published past-dated slot: ${slot.id} - ${slot.date.toISOString().slice(0,10)} ${slot.start}`);
      }
      
      console.log(`✅ Archived ${pastDatedSlots.length} published past-dated slots`);
    } else {
      console.log('✅ No published past-dated slots found');
    }
  } catch (error) {
    console.error('Error in startup archive check:', error);
  }
}

// Run startup check
startupArchiveCheck();

// Manual trigger for auto-archive (for testing)
app.post('/api/admin/trigger-auto-archive', authMiddleware, adminOrSuperAdminOnly, async (req, res) => {
  try {
    console.log('Manual auto-archive trigger requested');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    console.log(`Manual auto-archive: Checking for slots before ${today.toISOString().slice(0,10)}`);
    
    const allSlots = await prisma.timeslot.findMany({
      where: {
        archived: false
      }
    });
    
    const slotsToArchive = [];
    for (const slot of allSlots) {
      if (await isPastDateInUserTimezone(slot.date, slot.start)) {
        slotsToArchive.push(slot);
      }
    }
    
    console.log(`Found ${slotsToArchive.length} slots to archive (both published and unpublished)`);
    
    for (const slot of slotsToArchive) {
      console.log(`Slot to archive: ${slot.id} - Date: ${slot.date.toISOString().slice(0,10)}, Published: ${slot.published}, Archived: ${slot.archived}`);
      
      await prisma.timeslot.update({
        where: { id: slot.id },
        data: {
          archived: true,
          published: false,
          archivedBy: 'system'
        }
      });
      
      console.log(`Auto-archived slot ${slot.id}: ${slot.date.toISOString().slice(0,10)} ${slot.start} (was ${slot.published ? 'published' : 'unpublished'})`);
    }
    
    res.json({ 
      success: true, 
      message: `Auto-archived ${slotsToArchive.length} slots (both published and unpublished)`,
      archivedCount: slotsToArchive.length,
      archivedSlots: slotsToArchive.map(slot => ({
        id: slot.id,
        date: slot.date.toISOString().slice(0,10),
        start: slot.start,
        end: slot.end,
        wasPublished: slot.published
      }))
    });
  } catch (error) {
    console.error('Error in manual auto-archive:', error);
    res.status(500).json({ error: 'Failed to trigger auto-archive' });
  }
});

// ============================================
// AI-POWERED ENDPOINTS
// ============================================

const aiService = require('./utils/aiService');

// Smart Slot Recommendations
// GET /api/slots/recommendations?email=user@example.com
app.get('/api/slots/recommendations', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get available slots
    const availableSlots = await prisma.timeslot.findMany({
      where: {
        published: true,
        archived: false,
        date: { gte: new Date() },
        remaining: { gt: 0 }
      },
      orderBy: { date: 'asc' },
      take: 20
    });

    if (availableSlots.length === 0) {
      return res.json({ recommendations: [], message: 'No available slots found' });
    }

    // Get user's booking history
    const history = await prisma.registration.findMany({
      where: { email: email },
      include: { timeslot: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Prepare history summary for AI
    const historySummary = history.length > 0
      ? history.map(h => ({
          date: h.timeslot.date.toISOString().split('T')[0],
          time: h.timeslot.start,
          partySize: h.partySize,
          checkedIn: h.checkedIn
        }))
      : [];

    // Prepare available slots for AI
    const slotsInfo = availableSlots.map(s => ({
      id: s.id,
      date: s.date.toISOString().split('T')[0],
      time: s.start,
      endTime: s.end || s.start,
      remaining: s.remaining,
      capacity: s.capacity
    }));

    // Generate AI recommendations
    const prompt = `You are a helpful assistant for an appointment booking system.

Based on this user's booking history, suggest the 3 BEST time slots from the available slots.

User's previous bookings (${historySummary.length} total):
${historySummary.length > 0 
  ? historySummary.map(h => `- ${h.date} at ${h.time} (party size: ${h.partySize}, checked in: ${h.checkedIn ? 'yes' : 'no'})`).join('\n')
  : 'No previous bookings - this is a new user'
}

Available slots (${slotsInfo.length} total):
${slotsInfo.map(s => `- ID: ${s.id}, Date: ${s.date}, Time: ${s.time}${s.endTime ? `-${s.endTime}` : ''}, Remaining: ${s.remaining}/${s.capacity}`).join('\n')}

Consider:
- User's preferred times (if history exists)
- Convenience (weekends vs weekdays)
- Availability (prefer slots with more remaining capacity)
- Similar patterns from their history

Respond in JSON format:
{
  "recommendations": [
    {
      "slotId": "slot-id-here",
      "reason": "Brief explanation why this slot is recommended (1-2 sentences)"
    }
  ],
  "summary": "Brief overall summary of the recommendations"
}`;

    const aiResponse = await aiService.generateJSON(prompt, { model: 'gpt-4o-mini' });

    // Map AI recommendations to actual slots
    const recommendations = (aiResponse.recommendations || [])
      .map(rec => {
        const slot = availableSlots.find(s => s.id === rec.slotId);
        return slot
          ? {
              ...slot,
              recommendationReason: rec.reason || 'Recommended based on your preferences',
              aiSummary: aiResponse.summary
            }
          : null;
      })
      .filter(Boolean)
      .slice(0, 3);

    // Fallback: if AI didn't return good recommendations, return top 3 slots
    if (recommendations.length === 0) {
      const fallback = availableSlots.slice(0, 3).map(s => ({
        ...s,
        recommendationReason: 'Recommended slot based on availability',
        aiSummary: 'Showing available slots'
      }));
      return res.json({
        recommendations: fallback,
        fallback: true,
        message: 'AI recommendations unavailable, showing top available slots'
      });
    }

    res.json({
      recommendations,
      summary: aiResponse.summary,
      historyCount: history.length
    });
  } catch (error) {
    console.error('AI recommendation error:', error);
    // Graceful fallback
    try {
      const fallback = await prisma.timeslot.findMany({
        where: {
          published: true,
          archived: false,
          date: { gte: new Date() },
          remaining: { gt: 0 }
        },
        orderBy: { date: 'asc' },
        take: 3
      });
      res.json({
        recommendations: fallback.map(s => ({
          ...s,
          recommendationReason: 'Available slot',
          fallback: true
        })),
        fallback: true,
        error: 'AI service temporarily unavailable'
      });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  }
});

// Natural Language Booking
// POST /api/booking/natural-language
app.post('/api/booking/natural-language', async (req, res) => {
  try {
    const { message, email } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Parse intent using AI
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    const prompt = `Extract booking intent from this user message: "${message}"

Today's date: ${todayStr} (${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
Current year: ${currentYear}, Current month: ${currentMonth}

Return JSON with:
- action: "book" | "cancel" | "find" | "modify" | "check"
- date: actual date in YYYY-MM-DD format. IMPORTANT: If user mentions a specific date like "November 3rd", "Nov 3", "3rd November", use the CURRENT YEAR (${currentYear}) unless they specify otherwise. 
  Examples:
  - "November 3rd" → "${currentYear}-11-03" (if current month is November or later, otherwise next year)
  - "November 3" → "${currentYear}-11-03"
  - "Nov 3rd" → "${currentYear}-11-03"
  - If user says "tomorrow", calculate tomorrow's date
  - If "next sunday", calculate next Sunday's date
  - If "this weekend", use next Saturday
- time: preferred time as "morning" (before 12:00), "afternoon" (12:00-17:00), "evening" (after 17:00), or specific time like "14:00" if mentioned. If user says "best time" or "best slot", set to null (no time preference).
- partySize: number if mentioned, otherwise null
- urgency: "high" | "medium" | "low" based on language used

Examples:
- "Book me for next Sunday afternoon for 3 people" → {"action": "book", "date": "2025-11-09", "time": "afternoon", "partySize": 3, "urgency": "medium"}
- "book me the best time based on available slot on November 3rd" → {"action": "book", "date": "${currentYear}-11-03", "time": null, "partySize": null, "urgency": "medium"}
- "Find me slots on November 3" → {"action": "find", "date": "${currentYear}-11-03", "time": null, "partySize": null, "urgency": "medium"}
- "I need to cancel my booking" → {"action": "cancel", "date": null, "time": null, "partySize": null, "urgency": "high"}
- "Find me slots tomorrow morning" → {"action": "find", "date": "2025-11-03", "time": "morning", "partySize": null, "urgency": "medium"}

CRITICAL: For dates like "November 3rd" or "Nov 3", use year ${currentYear} if the date hasn't passed yet this year, otherwise use ${currentYear + 1}.

Respond in JSON format only.`;

    const intent = await aiService.generateJSON(prompt, { model: 'gpt-4o-mini' });

    // Handle different actions
    if (intent.action === 'cancel' && email) {
      // Find user's upcoming bookings
      const allBookings = await prisma.registration.findMany({
        where: {
          email: email,
          checkedIn: false
        },
        include: {
          timeslot: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Filter for future bookings
      const bookings = allBookings.filter(b => {
        const slotDate = new Date(b.timeslot.date);
        const slotDateTime = new Date(`${slotDate.toISOString().split('T')[0]}T${b.timeslot.start}`);
        return slotDateTime >= new Date();
      });

      return res.json({
        intent,
        message: bookings.length > 0 
          ? `Found ${bookings.length} upcoming booking(s)`
          : 'No upcoming bookings found for cancellation',
        bookings: bookings.map(b => ({
          id: b.id,
          date: b.timeslot.date.toISOString().split('T')[0],
          time: b.timeslot.start,
          partySize: b.partySize
        }))
      });
    }

    if (intent.action === 'find' || intent.action === 'book') {
      // Build date filter
      let dateFilter = {};
      if (intent.date) {
        // Parse the date string (YYYY-MM-DD format)
        const [year, month, day] = intent.date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        
        dateFilter = {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      } else {
        dateFilter = { date: { gte: new Date() } };
      }

      // Build time filter
      let timeFilter = {};
      if (intent.time) {
        if (intent.time === 'morning') {
          timeFilter = { start: { lte: '12:00' } };
        } else if (intent.time === 'afternoon') {
          timeFilter = { start: { gte: '12:00', lte: '17:00' } };
        } else if (intent.time === 'evening') {
          timeFilter = { start: { gte: '17:00' } };
        } else if (intent.time.match(/^\d{2}:\d{2}$/)) {
          // Specific time like "14:00"
          timeFilter = { start: intent.time };
        }
      }

      // Find matching slots
      const matchingSlots = await prisma.timeslot.findMany({
        where: {
          published: true,
          archived: false,
          remaining: { gt: 0 },
          ...dateFilter,
          ...timeFilter
        },
        orderBy: { date: 'asc' },
        take: 10
      });

      // Generate friendly response using ACTUAL slot dates, not intent date
      let responseMessage = `Found ${matchingSlots.length} available slot(s)`;
      
      if (matchingSlots.length > 0) {
        // Get unique dates from actual slots - handle date objects correctly
        const uniqueDates = [...new Set(matchingSlots.map(slot => {
          // Handle both Date objects and date strings
          let slotDate;
          if (slot.date instanceof Date) {
            slotDate = slot.date;
          } else {
            slotDate = new Date(slot.date);
          }
          // Get date only (ignore time) to avoid timezone issues
          const year = slotDate.getFullYear();
          const month = slotDate.getMonth();
          const day = slotDate.getDate();
          return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }))];
        
        if (uniqueDates.length === 1) {
          // Single date - show specific date using the actual date values
          const [year, month, day] = uniqueDates[0].split('-').map(Number);
          const dateObj = new Date(year, month - 1, day); // Use local time to avoid timezone issues
          const dateStr = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          responseMessage += ` for ${dateStr}`;
        } else if (uniqueDates.length > 1) {
          // Multiple dates - show date range
          const firstDate = new Date(uniqueDates[0]).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          });
          const lastDate = new Date(uniqueDates[uniqueDates.length - 1]).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          });
          responseMessage += ` from ${firstDate} to ${lastDate}`;
        }
      } else if (intent.date) {
        // Fallback to intent date if no slots found
        const dateStr = new Date(intent.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        responseMessage += ` for ${dateStr}`;
      }
      
      if (intent.time && matchingSlots.length > 0) {
        responseMessage += ` in the ${intent.time}`;
      }

      return res.json({
        intent,
        matchingSlots,
        message: responseMessage,
        canBook: matchingSlots.length > 0
      });
    }

    res.json({
      intent,
      message: 'I understood your request. How can I help you?',
      supportedActions: ['book', 'cancel', 'find', 'modify', 'check']
    });
  } catch (error) {
    console.error('Natural language booking error:', error);
    res.status(500).json({
      error: 'Failed to process your request. Please try rephrasing or use the standard booking form.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// AI-Powered Email Generation
// POST /api/ai/generate-email
app.post('/api/ai/generate-email', async (req, res) => {
  try {
    const { type, bookingData } = req.body;

    if (!type || !bookingData) {
      return res.status(400).json({ error: 'Type and bookingData are required' });
    }

    const templates = {
      confirmation: `Write a warm, welcoming confirmation email for ${bookingData.name || 'valued visitor'} 
        who has booked an appointment on ${bookingData.date || 'the selected date'} at ${bookingData.time || 'the selected time'}. 
        Include details about:
        - Appointment date and time
        - Party size: ${bookingData.partySize || 1} ${bookingData.partySize === 1 ? 'person' : 'people'}
        - QR code for check-in (mention it will be sent separately or shown on confirmation page)
        - Any special instructions or reminders
        - Contact information for changes
        
        Keep it friendly, professional, and concise (2-3 short paragraphs).`,
      
      reminder: `Write a friendly reminder email for ${bookingData.name || 'valued visitor'} 
        reminding them about their upcoming appointment on ${bookingData.date || 'the date'} at ${bookingData.time || 'the time'}.
        Party size: ${bookingData.partySize || 1}
        Send this 24 hours before the appointment.
        Keep it brief and helpful (1-2 paragraphs).`,
      
      cancellation: `Write a professional cancellation confirmation email for ${bookingData.name || 'valued visitor'}
        confirming that their appointment for ${bookingData.date || 'the date'} at ${bookingData.time || 'the time'} has been cancelled.
        Include information about rebooking if they wish.
        Keep it brief and courteous (1-2 paragraphs).`,
      
      waitlist: `Write a friendly waitlist notification email for ${bookingData.name || 'valued visitor'}
        letting them know that a slot has become available for ${bookingData.date || 'the date'} at ${bookingData.time || 'the time'}.
        Encourage them to book quickly as availability is limited.
        Keep it urgent but friendly (1-2 paragraphs).`
    };

    const prompt = templates[type] || templates.confirmation;
    const fullPrompt = `${prompt}\n\nBooking details: ${JSON.stringify(bookingData, null, 2)}`;

    const emailContent = await aiService.generate(fullPrompt, {
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 500
    });

    res.json({
      emailContent,
      type,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI email generation error:', error);
    res.status(500).json({ error: 'Failed to generate email content' });
  }
});

// AI Usage Stats (for admin)
// GET /api/ai/stats
app.get('/api/ai/stats', adminOnly, async (req, res) => {
  try {
    const stats = aiService.getUsageStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI stats' });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Export app for HTTPS server
module.exports = app;

// Only start HTTP server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, ()=>console.log('HTTP Server listening on', PORT));
}