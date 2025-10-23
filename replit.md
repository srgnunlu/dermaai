# Overview

This is a dermatological AI analysis application that allows medical professionals to upload skin lesion images and receive AI-powered diagnostic insights. The system uses both Google's Gemini and OpenAI's models to analyze dermatological conditions, providing comprehensive diagnostic results with confidence scores, key features, and treatment recommendations.

The application is built as a full-stack web application with a React frontend and Express.js backend, designed to handle patient data management, image analysis, and case tracking for dermatological diagnosis workflows.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design system
- **Styling**: Tailwind CSS with CSS custom properties for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **File Upload**: Uppy library with AWS S3 integration for direct-to-cloud uploads

## Backend Architecture

- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL as the primary database
- **AI Integration**: Dual AI model approach using Google Gemini and OpenAI APIs for comparative analysis
- **Object Storage**: Google Cloud Storage with Replit's sidecar service for file management
- **Development**: Hot module replacement with Vite in development mode

## Data Storage Solutions

- **Primary Database**: PostgreSQL with three main entities:
  - Users: Authentication and user management
  - Patients: Patient demographic and medical information
  - Cases: Diagnostic cases with image URLs, symptoms, medical history, and AI analysis results
- **File Storage**: Google Cloud Storage for medical images with ACL-based access control
- **Schema Management**: Drizzle Kit for database migrations and schema versioning

## Authentication and Authorization

- **Access Control**: Object-level ACL system with customizable access groups and permissions
- **File Security**: Secure object storage with metadata-based access policies
- **API Security**: Express middleware for request validation and error handling

## External Dependencies

- **AI Services**:
  - Google Gemini API for medical image analysis
  - OpenAI API for comparative diagnostic insights
- **Cloud Services**:
  - Google Cloud Storage for secure medical image storage
  - Neon Database for managed PostgreSQL hosting
- **Development Tools**:
  - Replit-specific integrations for development environment
  - ESBuild for production bundling
  - TypeScript for type safety across the entire stack

The architecture emphasizes medical data security, AI model diversity for improved diagnostic accuracy, and a responsive user interface optimized for healthcare workflows. The dual AI approach provides cross-validation of diagnostic results, while the comprehensive data model supports full case management from patient intake through diagnosis and treatment recommendations.

## Admin Panel Features

The application includes a comprehensive admin panel with role-based access control:

- **Case Management**: View and export individual case reports with full patient details and AI analysis results
- **User Management**: Complete user administration with promote/demote functionality for role management
- **System Statistics**: Real-time analytics including total cases, active users, and system performance metrics
- **Data Export**: CSV export capabilities for cases and comprehensive PDF reporting for individual diagnoses
