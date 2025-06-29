# 🎓 Academic OneStop Unified Educational Platform

An innovative unified platform designed for IITG to streamline academic administration and communication among students, faculty, and administrators. It consolidates key features like attendance, assignment management, grade tracking, leave workflows, and timetable personalization under one roof.

---

## 📌 Overview

**Academic OneStop** addresses the inefficiencies of using multiple disconnected platforms (like Coursera, Teams, OneStop, and the ERP portal) by providing an intuitive and integrated system tailored for IITG's academic ecosystem.

### 🔑 Key Features

- **Attendance System**: Real-time tracking with automated notifications for threshold breaches.
- **Comprehensive Grades**: Complete academic history with semester-wise CGPA tracking and visualization.
- **Leave Management**: Streamlined medical and academic leave application with approval workflows.
- **Dynamic Timetables**: Personalized schedules integrating class, lab, and extracurricular activities.
- **Assignment Ecosystem**: End-to-end assignment creation, submission, and evaluation platform.
- **Financial Integration**: Secure fee payment with transaction history and receipt generation.
- **Communication Center**: Instant messaging between students, faculty, and administrators.
- **Academic Calendar**: Important dates, deadlines, and event notifications.
- **Feedback Mechanism**: Course and instructor evaluation system.

---

## ⚙️ Technical Architecture

- **Frontend**: HTML, CSS, JavaScript, and optionally Bootstrap for responsive design.
- **Backend**: Node.js with Express.js framework.
- **Database**: MySQL for structured data storage.

---

## 🚀 Requirements

- **Node.js** (v14 or above)
- **MySQL Server**
- **NPM Packages**:
  - `express`
  - `mysql2`
  - `ejs`
  - `express-session`
  - `body-parser`
  - `bcryptjs` *(optional: for password hashing)*

---

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/academic-onestop.git
cd academic-onestop
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Database
* Create a MySQL database (e.g., `academic_onestop`)
* Import the schema from your SQL dump file
* Update DB credentials in the config file (`db.js` or `.env`)

### 4. Run the Application
```bash
node app.js
```
* Navigate to `http://localhost:3000` in your browser.

## 📚 Conclusion

The Academic OneStop platform is a transformative tool that integrates essential academic services into one system. It improves institutional efficiency, academic transparency, and user experience for the IITG community by addressing current fragmentation in educational tools and portals.