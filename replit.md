# MobileApp - Movie Platform with User Management

## Overview

This is a web-based movie platform application that provides user registration, authentication, and movie management features. The application supports both regular users and administrators, with a premium user system and integrated movie streaming capabilities through Google Drive links.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Responsive Design**: Mobile-first approach with CSS media queries
- **User Interface**: Multiple dashboards for different user roles (admin/regular users)
- **Client-side Routing**: Static HTML pages with JavaScript-based navigation

### Backend Architecture
- **Framework**: Express.js (Node.js)
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT (JSON Web Tokens) with bcrypt for password hashing
- **API Design**: RESTful endpoints for user management and movie operations

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon
- **Connection Management**: pg (node-postgres) with connection pooling
- **Schema**: Three main tables - users, movies, and vouchers
- **SSL**: Required for database connections

## Key Components

### Authentication System
- **Registration**: Username, email, and password validation
- **Login**: Email/password authentication with JWT token generation
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: JWT tokens for maintaining user sessions

### User Management
- **User Types**: Regular users, premium users, and administrators
- **Premium System**: Users can request premium status and administrators can approve
- **User Profiles**: Editable profiles with balance tracking

### Movie Management
- **Movie Storage**: Integration with Google Drive for video hosting
- **Access Control**: Premium content restrictions for regular users
- **CRUD Operations**: Full movie management for administrators

### Admin Panel
- **Statistics Dashboard**: User counts, premium requests, and movie totals
- **User Management**: View and manage all users, approve premium requests
- **Movie Management**: Add, edit, and delete movies
- **System Administration**: Comprehensive oversight of platform operations

## Data Flow

1. **User Registration**: Client form → Backend validation → Password hashing → Database storage
2. **Authentication**: Login credentials → JWT token generation → Client storage
3. **Movie Access**: User request → Authentication check → Premium status verification → Content delivery
4. **Premium Requests**: User submission → Admin notification → Approval process → Status update

## External Dependencies

### Backend Dependencies
- **express**: Web framework for Node.js
- **cors**: Cross-origin resource sharing middleware
- **pg**: PostgreSQL client for Node.js
- **bcrypt**: Password hashing library
- **jsonwebtoken**: JWT implementation for authentication

### External Services
- **Neon Database**: Managed PostgreSQL hosting
- **Google Drive**: Video file hosting and streaming

## Deployment Strategy

### Development Environment
- **Local Development**: Node.js server with static file serving
- **Database**: Neon PostgreSQL with SSL connection
- **Environment Variables**: JWT_SECRET and DATABASE_URL configuration

### Production Considerations
- **Static Files**: Served directly by Express.js
- **Database Initialization**: Automatic table creation on startup
- **SSL/HTTPS**: Required for database connections
- **CORS**: Configured for cross-origin requests

### Security Measures
- **Password Protection**: bcrypt hashing with salt
- **JWT Authentication**: Secure token-based authentication
- **Database Security**: SSL-required connections
- **Admin Access**: Special access code protection for admin functions

### Scalability Considerations
- **Connection Pooling**: Efficient database connection management
- **Stateless Authentication**: JWT tokens enable horizontal scaling
- **Static Asset Serving**: Efficient file delivery through Express.js