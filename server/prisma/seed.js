import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create system roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'System administrator with full access',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        students: ['create', 'read', 'update', 'delete'],
        teachers: ['create', 'read', 'update', 'delete'],
        assignments: ['create', 'read', 'update', 'delete'],
        grades: ['create', 'read', 'update', 'delete'],
        wellness: ['create', 'read', 'update', 'delete'],
        analytics: ['read'],
        system: ['manage']
      },
      isSystemRole: true
    }
  });

  const teacherRole = await prisma.role.upsert({
    where: { name: 'teacher' },
    update: {},
    create: {
      name: 'teacher',
      description: 'Teacher with classroom management access',
      permissions: {
        students: ['read', 'update'],
        assignments: ['create', 'read', 'update', 'delete'],
        grades: ['create', 'read', 'update'],
        classes: ['create', 'read', 'update'],
        wellness: ['read']
      },
      isSystemRole: true
    }
  });

  const studentRole = await prisma.role.upsert({
    where: { name: 'student' },
    update: {},
    create: {
      name: 'student',
      description: 'Student with limited access to own data',
      permissions: {
        assignments: ['read'],
        grades: ['read'],
        wellness: ['create', 'read', 'update'],
        profile: ['read', 'update']
      },
      isSystemRole: true
    }
  });

  // Create sample school
  const school = await prisma.school.create({
    data: {
      name: 'Demo High School',
      code: 'DHS001',
      type: 'public',
      address: '123 Education Street',
      city: 'Demo City',
      state: 'Demo State',
      postalCode: '12345',
      phone: '+1-555-0123',
      email: 'info@demohigh.edu',
      principalName: 'Dr. Jane Principal',
      establishedYear: 1995,
      board: 'State'
    }
  });

  // Create subjects
  const subjects = await Promise.all([
    prisma.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH',
        grade: 10,
        description: 'Advanced mathematics including algebra and geometry',
        category: 'core',
        credits: 4,
        colorCode: '#3B82F6'
      }
    }),
    prisma.subject.create({
      data: {
        name: 'Science',
        code: 'SCI',
        grade: 10,
        description: 'General science covering physics, chemistry, and biology',
        category: 'core',
        credits: 4,
        colorCode: '#10B981'
      }
    }),
    prisma.subject.create({
      data: {
        name: 'English',
        code: 'ENG',
        grade: 10,
        description: 'English language and literature',
        category: 'core',
        credits: 3,
        colorCode: '#F59E0B'
      }
    }),
    prisma.subject.create({
      data: {
        name: 'History',
        code: 'HIST',
        grade: 10,
        description: 'World history and social studies',
        category: 'core',
        credits: 3,
        colorCode: '#EF4444'
      }
    })
  ]);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      role: 'admin',
      status: 'active',
      emailVerified: true,
      profileCompleted: true
    }
  });

  // Create teacher user and profile
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@demo.com',
      passwordHash: await bcrypt.hash('teacher123', 12),
      role: 'teacher',
      status: 'active',
      emailVerified: true,
      profileCompleted: true,
      teacher: {
        create: {
          teacherId: 'TCH001',
          firstName: 'John',
          lastName: 'Teacher',
          subjects: [subjects[0].id, subjects[1].id], // Math and Science
          qualifications: 'M.Ed in Mathematics, B.Sc in Physics',
          experienceYears: 8,
          schoolId: school.id,
          department: 'Science & Mathematics'
        }
      }
    },
    include: {
      teacher: true
    }
  });

  // Create parent user and profile
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@demo.com',
      passwordHash: await bcrypt.hash('parent123', 12),
      role: 'parent',
      status: 'active',
      emailVerified: true,
      profileCompleted: true,
      parent: {
        create: {
          firstName: 'Mary',
          lastName: 'Parent',
          relationshipToStudent: 'mother',
          occupation: 'Software Engineer',
          workplace: 'Tech Corp Inc.',
          address: '456 Parent Avenue, Demo City'
        }
      }
    },
    include: {
      parent: true
    }
  });

  // Create student user and profile
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@demo.com',
      passwordHash: await bcrypt.hash('student123', 12),
      role: 'student',
      status: 'active',
      emailVerified: true,
      profileCompleted: true,
      student: {
        create: {
          studentId: 'STU001',
          firstName: 'Jane',
          lastName: 'Student',
          dateOfBirth: new Date('2008-05-15'),
          gender: 'female',
          grade: 10,
          section: 'A',
          schoolId: school.id,
          parentId: parentUser.parent.id,
          admissionDate: new Date('2023-09-01'),
          bloodGroup: 'O+',
          address: '456 Parent Avenue, Demo City',
          emergencyContact: '+1-555-0456',
          interests: ['mathematics', 'science', 'reading'],
          learningStyle: 'visual'
        }
      }
    },
    include: {
      student: true
    }
  });

  // Create classes
  const mathClass = await prisma.class.create({
    data: {
      teacherId: teacherUser.teacher.id,
      subjectId: subjects[0].id, // Mathematics
      grade: 10,
      section: 'A',
      schoolYear: '2024-25',
      schedule: [
        { day: 'monday', startTime: '09:00', endTime: '10:00', room: 'Room 101' },
        { day: 'wednesday', startTime: '09:00', endTime: '10:00', room: 'Room 101' },
        { day: 'friday', startTime: '09:00', endTime: '10:00', room: 'Room 101' }
      ],
      roomNumber: 'Room 101',
      maxStudents: 30,
      description: 'Advanced Mathematics for Grade 10'
    }
  });

  const scienceClass = await prisma.class.create({
    data: {
      teacherId: teacherUser.teacher.id,
      subjectId: subjects[1].id, // Science
      grade: 10,
      section: 'A',
      schoolYear: '2024-25',
      schedule: [
        { day: 'tuesday', startTime: '10:00', endTime: '11:00', room: 'Lab 201' },
        { day: 'thursday', startTime: '10:00', endTime: '11:00', room: 'Lab 201' }
      ],
      roomNumber: 'Lab 201',
      maxStudents: 25,
      description: 'General Science with Lab Work'
    }
  });

  // Enroll student in classes
  await Promise.all([
    prisma.studentClass.create({
      data: {
        studentId: studentUser.student.id,
        classId: mathClass.id,
        status: 'active'
      }
    }),
    prisma.studentClass.create({
      data: {
        studentId: studentUser.student.id,
        classId: scienceClass.id,
        status: 'active'
      }
    })
  ]);

  // Create sample assignments
  const mathAssignment = await prisma.assignment.create({
    data: {
      classId: mathClass.id,
      title: 'Algebra Worksheet - Quadratic Equations',
      description: 'Complete problems 1-20 on quadratic equations. Show all work.',
      type: 'homework',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      totalMarks: 100,
      instructions: 'Solve each equation step by step. Use the quadratic formula where necessary.',
      createdBy: teacherUser.id,
      weight: 0.15,
      allowLateSubmission: true,
      latePenalty: 0.1
    }
  });

  const scienceAssignment = await prisma.assignment.create({
    data: {
      classId: scienceClass.id,
      title: 'Lab Report - Chemical Reactions',
      description: 'Write a detailed lab report on the chemical reactions observed in class.',
      type: 'project',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
      totalMarks: 50,
      instructions: 'Include hypothesis, methodology, observations, and conclusions.',
      createdBy: teacherUser.id,
      weight: 0.25,
      allowLateSubmission: true,
      latePenalty: 0.15
    }
  });

  // Create sample mental health records
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const recordDate = new Date(today);
    recordDate.setDate(today.getDate() - i);
    
    await prisma.mentalHealthRecord.create({
      data: {
        studentId: studentUser.student.id,
        date: recordDate,
        moodRating: Math.floor(Math.random() * 5) + 4, // 4-8 range
        stressLevel: Math.floor(Math.random() * 4) + 3, // 3-6 range
        sleepHours: 7 + Math.random() * 2, // 7-9 hours
        energyLevel: Math.floor(Math.random() * 3) + 6, // 6-8 range
        anxietyLevel: Math.floor(Math.random() * 3) + 2, // 2-4 range
        notes: i === 0 ? 'Feeling good today, ready for the math test tomorrow!' : null,
        triggers: i === 2 ? ['academic_pressure'] : [],
        copingStrategiesUsed: i === 1 ? ['deep_breathing', 'exercise'] : []
      }
    });
  }

  // Create sample learning analytics
  const activityTypes = ['study_session', 'assignment_completion', 'quiz_attempt', 'video_watched'];
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    await prisma.learningAnalytic.create({
      data: {
        studentId: studentUser.student.id,
        subjectId: subjects[Math.floor(Math.random() * subjects.length)].id,
        activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        durationMinutes: Math.floor(Math.random() * 120) + 15, // 15-135 minutes
        performanceScore: Math.random() * 40 + 60, // 60-100 range
        difficultyLevel: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        completionRate: Math.random() * 30 + 70, // 70-100 range
        engagementScore: Math.random() * 30 + 70, // 70-100 range
        timestamp,
        metadata: {
          device: 'laptop',
          browser: 'chrome',
          sessionId: `session_${i}`
        }
      }
    });
  }

  // Create system settings
  await Promise.all([
    prisma.systemSetting.create({
      data: {
        key: 'app_name',
        value: 'Student CRM',
        type: 'string',
        description: 'Application name',
        isPublic: true
      }
    }),
    prisma.systemSetting.create({
      data: {
        key: 'max_file_size',
        value: '10485760',
        type: 'number',
        description: 'Maximum file upload size in bytes',
        isPublic: false
      }
    }),
    prisma.systemSetting.create({
      data: {
        key: 'enable_notifications',
        value: 'true',
        type: 'boolean',
        description: 'Enable push notifications',
        isPublic: false
      }
    })
  ]);

  console.log('Database seeded successfully!');
  console.log('\nDemo accounts created:');
  console.log('Admin: admin@demo.com / admin123');
  console.log('Teacher: teacher@demo.com / teacher123');
  console.log('Student: student@demo.com / student123');
  console.log('Parent: parent@demo.com / parent123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });