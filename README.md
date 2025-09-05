# AI-Powered Student CRM System

A comprehensive Student Customer Relationship Management (CRM) system built with React, Node.js, Express, and PostgreSQL with Prisma ORM. This system provides AI-powered insights for student management, academic tracking, mental health monitoring, and personalized learning experiences.

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role system (Students, Teachers, Parents, Admins, Counselors)
- **Academic Management**: Classes, assignments, submissions, and grading
- **Mental Health & Wellness**: Mood tracking, counseling sessions, and wellness analytics
- **AI-Powered Insights**: Personalized recommendations and learning analytics
- **Communication**: Real-time messaging and notifications
- **File Management**: Secure file uploads and storage
- **Analytics & Reporting**: Comprehensive dashboards and progress tracking

### AI Features
- Personalized study recommendations
- Mental health alert system
- Learning pattern analysis
- Performance prediction
- Automated insights generation

### Security Features
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Data encryption and secure file handling
- Audit logging
- Session management

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Prisma ORM** for database management
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads
- **Zod** for validation

### AI & Analytics
- **OpenAI API** integration
- Custom analytics engine
- Machine learning insights

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd student-crm
```

### 2. Backend Setup
```bash
cd server
npm install
```

### 3. Database Setup
```bash
# Copy environment variables
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/student_crm?schema=public"

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### 4. Frontend Setup
```bash
cd ../client
npm install
```

### 5. Environment Configuration

#### Server (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/student_crm?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
REFRESH_TOKEN_EXPIRE=30d

# OpenAI (optional)
OPENAI_API_KEY=your-openai-api-key-here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FROM_NAME=Student CRM

# Other settings
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=10485760
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start backend server
cd server
npm run dev

# Start frontend (in another terminal)
cd client
npm run dev
```

### Production Mode
```bash
# Build frontend
cd client
npm run build

# Start backend
cd server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database Studio: http://localhost:5555 (run `npm run db:studio`)

## 👥 Demo Accounts

After running the seed script, you can use these demo accounts:

- **Admin**: admin@demo.com / admin123
- **Teacher**: teacher@demo.com / teacher123
- **Student**: student@demo.com / student123
- **Parent**: parent@demo.com / parent123

## 📊 Database Schema

The system uses a comprehensive PostgreSQL schema with the following main entities:

### Core Tables
- **Users**: Authentication and basic user info
- **Students**: Student profiles and academic info
- **Teachers**: Teacher profiles and qualifications
- **Parents**: Parent/guardian information
- **Schools**: Educational institution data

### Academic Tables
- **Subjects**: Course subjects and curriculum
- **Classes**: Class schedules and enrollment
- **Assignments**: Homework, projects, and assessments
- **Grades**: Academic performance tracking

### Wellness Tables
- **Mental Health Records**: Daily wellness tracking
- **Counseling Sessions**: Professional support sessions
- **Mental Health Alerts**: Automated concern detection

### Communication Tables
- **Messages**: Real-time messaging system
- **Conversations**: Group and direct conversations
- **Notifications**: System-wide notifications

### Analytics Tables
- **Learning Analytics**: Study patterns and performance
- **AI Recommendations**: Personalized suggestions
- **Student Progress**: Skill development tracking

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Assignments
- `GET /api/assignments` - List assignments
- `GET /api/assignments/:id` - Get assignment details
- `POST /api/assignments` - Create assignment
- `POST /api/assignments/:id/submit` - Submit assignment
- `PUT /api/assignments/:id/grade/:studentId` - Grade submission

### Wellness
- `GET /api/wellness/records/:studentId` - Get wellness records
- `POST /api/wellness/records/:studentId` - Create wellness record
- `GET /api/wellness/analytics/:studentId` - Get wellness analytics
- `GET /api/wellness/alerts` - Get mental health alerts

### AI Features
- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/study-suggestions` - Get study recommendations
- `POST /api/ai/study-plan` - Generate study plan

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Session management and tracking
- Password hashing with bcrypt

### Data Protection
- Input validation with Zod
- SQL injection prevention with Prisma
- XSS protection with helmet
- Rate limiting
- CORS configuration

### File Security
- File type validation
- Size limits
- Virus scanning status tracking
- Secure file storage

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 📈 Monitoring & Analytics

The system includes comprehensive analytics:

- **Academic Performance**: Grade trends and subject analysis
- **Learning Patterns**: Study time and engagement metrics
- **Wellness Tracking**: Mental health trends and alerts
- **System Usage**: User activity and feature adoption

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🚀 Deployment

### Using Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Build frontend: `npm run build`
4. Start backend: `npm start`
5. Serve frontend with nginx or similar

## 🔮 Future Enhancements

- Mobile app development
- Advanced AI features
- Integration with learning management systems
- Multi-language support
- Advanced reporting and analytics
- Parent portal enhancements
- Gamification features