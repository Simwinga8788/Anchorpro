# Anchor Pro - System Overview

## 🎯 Purpose
Anchor Pro is a comprehensive Maintenance Management System designed to streamline equipment maintenance, job tracking, and downtime reporting for industrial operations.

## 📋 Core Features

### 1. Dashboard
- **Real-time KPIs**: Active jobs, overdue tasks, today's schedule, completion rate
- **Activity Feed**: Recent job updates and status changes
- **Workload Distribution**: Visual breakdown of job types (Preventive, Corrective, Other)
- **Live Data**: All metrics calculated from actual database records

### 2. Job Card Management
- **Create & Edit**: Full CRUD operations for maintenance jobs
- **Filtering**: By status (All, Scheduled, In Progress, Completed, On Hold)
- **Priority Levels**: Critical, High, Normal, Low
- **Job Types**: Preventive Maintenance, Corrective Maintenance, Inspection, Calibration, Emergency Repair
- **Equipment Assignment**: Link jobs to specific equipment
- **Status Tracking**: Unscheduled → Scheduled → In Progress → Completed/On Hold

### 3. Planning Board
- **Kanban View**: Visual workflow management
- **Three Columns**: To-Do, Scheduled, In Progress
- **Drag-and-Drop Ready**: Structure prepared for task movement
- **Color-Coded Priorities**: Visual indicators for urgency
- **Role-Based Access**: Admin, Planner, Supervisor roles

### 4. Task Execution (Technician View)
- **Interactive Checklists**: Real-time task completion tracking
- **Job Controls**: Start, Pause, Complete buttons
- **Visual Progress**: Checkboxes with completion indicators
- **Job Details**: Equipment info, job type, description
- **Status Updates**: Automatic job status changes based on task completion

### 5. Equipment Registry
- **Equipment Database**: Name, serial number, model, manufacturer, location
- **Full CRUD**: Create, Read, Update, Delete operations
- **Job Linking**: Track which jobs are assigned to each piece of equipment
- **Search & Filter**: Quick equipment lookup

### 6. Downtime Reporting ⭐ NEW
- **Flexible Reporting**: Equipment and non-equipment delays
- **Delay Types**:
  - Equipment Breakdown
  - Equipment Delay
  - Material Shortage
  - Staffing Issue
  - Quality Issue
  - Process Delay
  - Other
- **Status Tracking**: Ongoing vs Resolved
- **Timer Features**:
  - Elapsed time indicator for ongoing delays
  - "End Now" button to close delays instantly
  - Automatic duration calculation
- **Impact Tracking**: Cost estimates, production loss
- **Root Cause Analysis**: Document causes and resolutions

### 7. User Management (Admin)
- **User CRUD**: Create, view, delete users
- **Role Assignment**: Admin, Supervisor, Planner, Technician
- **Access Control**: Role-based permissions
- **Protected Admin**: Cannot delete super admin account

## 🏗️ Technical Architecture

### Technology Stack
- **Framework**: .NET 8 Blazor Server
- **Database**: SQL Server Express (LocalDB)
- **ORM**: Entity Framework Core 8
- **Authentication**: ASP.NET Core Identity
- **UI Framework**: Bootstrap 5 + Custom Apple-inspired CSS
- **Rendering**: Interactive Server with prerendering disabled for performance

### Design System
- **Color Palette**: Emerald Green (#10B981) primary, Charcoal (#1D1D1F) sidebar
- **Typography**: SF Pro Display-inspired, -apple-system font stack
- **Spacing**: 4px grid system
- **Components**: Apple-quality buttons, cards, forms, tables
- **Animations**: Smooth cubic-bezier transitions (200ms)

### Database Schema
**Core Entities:**
- `JobCard`: Work orders with status, priority, type
- `Equipment`: Assets and machinery
- `JobTask`: Checklist items for jobs
- `JobType`: Categorization (Preventive, Corrective, etc.)
- `DowntimeCategory`: Classification for delays
- `ApplicationUser`: Extended Identity user with roles

**Relationships:**
- JobCard → Equipment (Many-to-One)
- JobCard → JobType (Many-to-One)
- JobCard → JobTasks (One-to-Many)
- Equipment → JobCards (One-to-Many)

## 🔐 Security

### Authentication
- ASP.NET Core Identity with cookie-based auth
- Secure password hashing (PBKDF2)
- Login/Logout functionality
- Session management

### Authorization
- Role-based access control (RBAC)
- `[Authorize]` attributes on all protected pages
- Role-specific features:
  - **Admin**: Full system access, user management
  - **Supervisor**: Job creation, planning, reporting
  - **Planner**: Planning board, job scheduling
  - **Technician**: Task execution, downtime reporting

### Data Protection
- SQL injection prevention via EF Core parameterization
- XSS protection via Blazor's automatic encoding
- CSRF protection via antiforgery tokens
- Trusted connection to database

## 📊 Performance Optimizations

### Database
- Connection pooling (Max 200 connections)
- 30-second command timeout
- Optimized queries with proper indexing
- Async/await throughout

### Rendering
- Prerendering disabled (`prerender: false`)
- Interactive Server mode for instant updates
- Minimal initial load time
- Hot reload enabled for development

### UI/UX
- Apple-quality micro-interactions
- Smooth transitions (150-300ms)
- Lazy loading where applicable
- Responsive design

## 🚀 Deployment

### Development
```bash
cd AnchorPro
dotnet watch
```
Access at: `http://localhost:5165`

### Production
```bash
dotnet publish -c Release
# Deploy to IIS or Azure App Service
```

### Database Migration
```bash
dotnet ef database update
```

## 📈 Future Enhancements (Roadmap)

### Phase 2
- [ ] Drag-and-drop job scheduling
- [ ] Real-time notifications (SignalR)
- [ ] Document attachments
- [ ] Parts inventory management
- [ ] Advanced reporting & analytics
- [ ] Mobile app (Blazor Hybrid)
- [ ] Export to PDF/Excel
- [ ] Downtime history dashboard
- [ ] Preventive maintenance scheduling automation

### Phase 3
- [ ] IoT sensor integration
- [ ] Predictive maintenance AI
- [ ] Multi-tenant support
- [ ] API for third-party integrations
- [ ] Advanced analytics & BI dashboards

## 🐛 Known Limitations

### Current Version (v1.0)
- Planning board drag-and-drop not yet implemented (structure ready)
- Downtime reports not persisted to database (TODO in code)
- User edit functionality placeholder only
- No email notifications
- Single-tenant only

## 📞 Support

### Default Credentials
- **Admin**: admin@anchor.com / AnchorPro!123
- **Supervisor**: supervisor@anchor.com / AnchorPro!123
- **Technician**: tech@anchor.com / AnchorPro!123

### Database Connection
```
Server=DESKTOP-U6O1NKU\\SQLEXPRESS;
Database=AnchorPro_Final;
Trusted_Connection=True;
```

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Built with**: .NET 8, Blazor Server, SQL Server
