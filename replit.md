# Overview

This is an AI Resume Generator web application that helps users create optimized resumes using AI technology. Users can upload their existing resume and a job description, then the application uses AI to enhance and tailor the resume content to better match the job requirements. The app supports multiple output formats and resume templates, providing both template-based generation and format-preserving enhancement options.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for client-side routing with a multi-step wizard flow (Upload → Process → Preview → Download)
- **State Management**: TanStack Query for server state management and API caching
- **Component Structure**: Modular design with reusable UI components and page-specific components

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Processing**: Python microservices for document parsing (PDF, DOCX, TXT) and AI processing
- **Storage**: In-memory storage with interfaces designed for easy database migration
- **API Design**: RESTful endpoints with structured request/response patterns

## Data Storage Solutions
- **Current**: In-memory storage using Map-based implementations
- **Database Ready**: Drizzle ORM configured for PostgreSQL with migration support
- **Schema**: User management and resume job tracking with status management
- **File Handling**: Multer for file uploads with size limits and type validation

## Authentication and Authorization
- **Current State**: Basic user schema defined but authentication not fully implemented
- **Prepared Infrastructure**: User table with username/password fields ready for authentication implementation
- **Session Management**: Connect-pg-simple configured for PostgreSQL session storage

## External Service Integrations
- **AI Processing**: LLaMA model integration via Hugging Face transformers for content enhancement
- **Document Processing**: Python-based services using PyPDF2, python-docx for text extraction
- **Resume Generation**: Template-based HTML/CSS generation with WeasyPrint for PDF conversion
- **File Format Support**: Multi-format input (PDF/DOCX/TXT) and output (PDF/DOCX) capabilities

## Key Design Patterns
- **Multi-step Wizard**: Step-by-step user flow with progress tracking
- **Service-Oriented**: Python microservices for specialized processing tasks
- **Template System**: Jinja2-based resume templates (Classic, Modern, Creative, Executive)
- **Async Processing**: Background job processing for AI enhancement tasks
- **Modular Components**: Reusable UI components with consistent design system

# External Dependencies

## Core Framework Dependencies
- **Frontend**: React, TypeScript, Vite, Wouter for routing
- **Backend**: Express.js, Node.js with TypeScript support
- **UI Components**: Radix UI primitives, Tailwind CSS, Shadcn/UI component library

## Database and ORM
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with Zod schema validation
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless connection support

## AI and Document Processing
- **AI Model**: Hugging Face Transformers with LLaMA model support
- **Document Parsing**: PyPDF2 for PDF processing, python-docx for Word documents
- **Template Engine**: Jinja2 for HTML template rendering
- **PDF Generation**: WeasyPrint for HTML to PDF conversion

## File Upload and Processing
- **Upload Handling**: Multer middleware for multipart form data
- **File Validation**: MIME type checking and file size limits
- **Storage**: Local file system with organized directory structure

## Development and Build Tools
- **Build Tools**: Vite with React plugin, ESBuild for production builds
- **Development**: TSX for TypeScript execution, nodemon-like development workflow
- **Code Quality**: TypeScript strict mode, path mapping for clean imports

## Deployment and Platform
- **Platform**: Replit-optimized with specific plugins and error handling
- **Environment**: Containerized development with Python service integration
- **Session Storage**: PostgreSQL-backed session management ready for production