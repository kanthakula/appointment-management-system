const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password){
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}$${derived}`;
}

async function main(){
  console.log('Seeding database...');

  // Create default organization config
  const orgConfig = await prisma.organizationConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      organizationName: 'DarshanFlow',
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      backgroundColor: '#F9FAFB',
      textColor: '#111827',
      timezone: 'America/Chicago',
      allowUserRegistration: false
    }
  });

  // Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full system access, create all user types, manage everything',
      permissions: [
        'manage_users',
        'create_super_admin',
        'create_admin',
        'create_checkin_user',
        'create_reporting_user',
        'manage_timeslots',
        'manage_bookings',
        'view_reports',
        'manage_settings',
        'view_audit_logs'
      ]
    }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      displayName: 'Admin',
      description: 'Customer-side management, create other admins and CheckIn users, assign roles',
      permissions: [
        'manage_users',
        'create_admin', // Add this permission
        'create_checkin_user',
        'create_reporting_user',
        'manage_timeslots',
        'manage_bookings',
        'view_reports',
        'view_audit_logs'
      ]
    }
  });

  const checkinUserRole = await prisma.role.upsert({
    where: { name: 'checkin_user' },
    update: {},
    create: {
      name: 'checkin_user',
      displayName: 'CheckIn User',
      description: 'View all bookings, check-in attendees, limited access',
      permissions: [
        'view_bookings',
        'checkin_attendees',
        'view_timeslots'
      ]
    }
  });

  const reportingRole = await prisma.role.upsert({
    where: { name: 'reporting' },
    update: {},
    create: {
      name: 'reporting',
      displayName: 'Reporting',
      description: 'Generate reports, view analytics (coming soon)',
      permissions: [
        'view_reports',
        'view_bookings',
        'view_timeslots'
      ]
    }
  });

  // Create default super admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'akuladatta@gmail.com' },
    update: {},
    create: {
      email: 'akuladatta@gmail.com',
      name: 'Super Admin',
      phone: '+1-555-0123',
      password: hashPassword('Appaji@1942'),
      role: 'super_admin', // Legacy field
      recurring: false,
      active: true
    }
  });

  // Assign super admin role to the user
  await prisma.userRole.upsert({
    where: { 
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id
    }
  });

  // Create a sample admin user with multiple roles (Admin + Reporting)
  const sampleAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Sample Admin',
      phone: '+1-555-0124',
      password: hashPassword('admin123'),
      role: 'admin', // Legacy field
      recurring: false,
      active: true,
      createdBy: adminUser.id
    }
  });

  // Assign admin role to sample admin
  await prisma.userRole.upsert({
    where: { 
      userId_roleId: {
        userId: sampleAdmin.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: sampleAdmin.id,
      roleId: adminRole.id,
      assignedBy: adminUser.id
    }
  });

  // Assign reporting role to sample admin (multi-role example)
  await prisma.userRole.upsert({
    where: { 
      userId_roleId: {
        userId: sampleAdmin.id,
        roleId: reportingRole.id
      }
    },
    update: {},
    create: {
      userId: sampleAdmin.id,
      roleId: reportingRole.id,
      assignedBy: adminUser.id
    }
  });

  // Create a sample checkin user
  const checkinUser = await prisma.user.upsert({
    where: { email: 'checkin@example.com' },
    update: {},
    create: {
      email: 'checkin@example.com',
      name: 'CheckIn Staff',
      phone: '+1-555-0125',
      password: hashPassword('checkin123'),
      role: 'checkin_user', // Legacy field
      recurring: false,
      active: true,
      createdBy: adminUser.id
    }
  });

  // Assign checkin user role
  await prisma.userRole.upsert({
    where: { 
      userId_roleId: {
        userId: checkinUser.id,
        roleId: checkinUserRole.id
      }
    },
    update: {},
    create: {
      userId: checkinUser.id,
      roleId: checkinUserRole.id,
      assignedBy: adminUser.id
    }
  });

  // Create some sample timeslots
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const timeslot1 = await prisma.timeslot.upsert({
    where: { id: 'sample-slot-1' },
    update: {},
    create: {
      id: 'sample-slot-1',
      date: tomorrow,
      start: '09:00',
      end: '10:00',
      capacity: 20,
      remaining: 20,
      published: true,
      createdBy: adminUser.id
    }
  });

  const timeslot2 = await prisma.timeslot.upsert({
    where: { id: 'sample-slot-2' },
    update: {},
    create: {
      id: 'sample-slot-2',
      date: tomorrow,
      start: '10:30',
      end: '11:30',
      capacity: 15,
      remaining: 15,
      published: true,
      createdBy: adminUser.id
    }
  });

  const timeslot3 = await prisma.timeslot.upsert({
    where: { id: 'sample-slot-3' },
    update: {},
    create: {
      id: 'sample-slot-3',
      date: tomorrow,
      start: '14:00',
      end: '15:00',
      capacity: 25,
      remaining: 25,
      published: false,
      createdBy: adminUser.id
    }
  });

  console.log('Database seeded successfully!');
  console.log('\n=== User Credentials ===');
  console.log('Super Admin:');
  console.log('  Email: akuladatta@gmail.com');
  console.log('  Password: Appaji@1942');
  console.log('  Roles: Super Admin (full access)');
  console.log('\nSample Admin (Multi-Role):');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123');
  console.log('  Roles: Admin + Reporting');
  console.log('\nCheckIn User:');
  console.log('  Email: checkin@example.com');
  console.log('  Password: checkin123');
  console.log('  Roles: CheckIn User');
  console.log('\nOrganization: DarshanFlow');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });