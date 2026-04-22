# Anchor Pro - Maintenance Management System

## 🎨 Design System

### Color Palette
- **Primary Accent**: `#10B981` (Emerald Green) - Actions, CTAs, Success states
- **Sidebar**: `#2D3748` (Charcoal) - Navigation, Dark UI elements  
- **Background**: `#F9FAFB` (Light Gray) - Main content area
- **Text Primary**: `#1F2937` (Dark Gray) - Headings, important text
- **Text Secondary**: `#6B7280` (Medium Gray) - Supporting text

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Secondary Font**: Roboto (Google Fonts)
- **Headings**: Bold, uppercase for section titles
- **Body**: Regular weight, 14-16px

### Components
- **Buttons**: 
  - Primary: Emerald background, white text, rounded corners
  - Secondary: White background, gray border
  - Danger: Red outline for destructive actions
- **Cards**: White background, subtle shadow, 12px border radius
- **Tables**: Minimal borders, hover effects, clean spacing
- **Forms**: Floating labels, emerald focus states

## 📋 Features Implemented

### ✅ Phase 1 Complete

#### Authentication & Authorization
- [x] Login page with professional styling
- [x] Logout functionality (visible button)
- [x] Role-based access control (Admin, Supervisor, Planner, Technician)
- [x] Secure routes with `[Authorize]` attributes

#### Dashboard
- [x] KPI cards with real-time data
- [x] Activity feed
- [x] Project type distribution chart
- [x] Responsive grid layout

#### Job Card Management
- [x] List view with filters (Status, Priority, Search)
- [x] Create new job cards
- [x] Edit existing jobs
- [x] View job details
- [x] Status badges (color-coded)
- [x] Priority indicators

#### Planning Board
- [x] Kanban-style columns (To-Do, Scheduled, In Progress)
- [x] **New:** Interactive Assignment Modal with full job details
- [x] **New:** Technician Workload Visualization (Real-time bars)
- [x] Job assignment workflow with status updates

#### Task Execution (Technician View)
- [x] Interactive checklist for technicians
- [x] **New:** Smart Pause/Resume (Auto-Timer)
- [x] **New:** Integrated Downtime Reporting (Modal-based)
- [x] Job status controls connected to time tracking
- [x] Visual progress indicators

#### Downtime Management
- [x] **New:** Modal-based reporting directly from task
- [x] Automatic start/stop timestamps
- [x] Active downtime tracking
- [x] Reason codes and descriptions

#### Equipment Management
- [x] Equipment list with search
- [x] Create new equipment
- [x] Edit equipment details
- [x] Delete equipment
- [x] Equipment assignment to jobs

#### User Management (Admin)
- [x] User list with roles
- [x] Create new users
- [x] Delete users (with protection for admin)
- [x] Role assignment

## 🗄️ Database

### Connection String
```json
{
  "DefaultConnection": "Server=DESKTOP-U6O1NKU\\SQLEXPRESS;Database=AnchorPro_Final;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Connection Timeout=30;Max Pool Size=200;Pooling=true;"
}
```

### Seeded Data
- **Users**: admin@anchor.com, supervisor@anchor.com, tech@anchor.com
- **Default Password**: `AnchorPro!123`
- **Job Types**: Preventive Maintenance, Corrective Maintenance, Inspection, Calibration, Emergency Repair
- **Equipment**: CNC Lathe, Hydraulic Press, Welding Robot, Milling Machine
- **Sample Jobs**: JOB-101, JOB-102, JOB-103, JOB-201, JOB-442

## 🚀 Running the Application

### Development Mode
```bash
cd AnchorPro
dotnet watch
```

### Production Build
```bash
dotnet build --configuration Release
dotnet run --configuration Release
```

### Access
- **URL**: http://localhost:5165
- **Admin Login**: admin@anchor.com / AnchorPro!123

## 🏗️ Architecture

### Technology Stack
- **Framework**: .NET 8 Blazor Server
- **Database**: SQL Server Express (LocalDB)
- **ORM**: Entity Framework Core 8
- **Authentication**: ASP.NET Core Identity
- **UI**: Bootstrap 5 + Custom CSS

### Project Structure
```
AnchorPro/
├── Components/
│   ├── Account/          # Authentication pages
│   ├── Layout/           # MainLayout, NavMenu
│   └── Pages/
│       ├── Admin/        # User management
│       ├── Equipment/    # Equipment CRUD
│       ├── JobCards/     # Job card management
│       ├── Planning/     # Planning board
│       └── Tasks/        # Task execution
├── Data/
│   ├── Entities/         # Database models
│   ├── Enums/           # Status, Priority enums
│   └── DbSeeder.cs      # Seed data
├── Services/            # Business logic layer
└── wwwroot/
    └── app.css          # Custom styling
```

## 🎯 Next Steps (Phase 2)

### Planned Features
- [ ] Drag-and-drop job scheduling
- [ ] Time tracking and reporting
- [ ] Parts inventory management
- [ ] Document attachments
- [ ] Mobile-responsive improvements
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Export to PDF/Excel

## 🐛 Known Issues
- None currently reported

## 📝 Notes
- Hot reload enabled with `dotnet watch`
- Prerendering disabled for instant page loads
- HTTPS redirection disabled for local development
- Connection pooling optimized for SQL Express

---

**Built with ❤️ using .NET 8 Blazor**
