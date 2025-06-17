# WordWise AI

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/pranjals-projects-82cc138b/v0-word-wise-ai)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/yDvEfAMV71m)

## Overview

WordWise AI is a document management and writing assistance platform that supports multiple file formats for document upload and analysis.

## Features

### 📄 Document Upload & Processing
- **Text Files (.txt)**: Direct text file upload and processing
- **Markdown Files (.md)**: Full markdown file support with formatting preservation
- **Word Documents (.docx)**: ⚠️ **Temporarily disabled** - Will be fixed in a future update
- **File Metadata Tracking**: Stores original file name, size, and type for reference

### 🔧 File Processing
- **Smart File Detection**: Automatically detects file types and applies appropriate parsing
- **Error Handling**: Graceful handling of unsupported files with user-friendly error messages
- **Progress Indicators**: Real-time feedback during file processing
- **Content Extraction**: Preserves formatting and structure from source documents

### 🔐 Authentication
- **Clerk Authentication**: Secure user authentication with sign-in and sign-up
- **Protected Routes**: Automatic redirection to login for unauthenticated users
- **User Session Management**: Persistent user sessions across the application

## Setup Instructions

### Prerequisites

- Node.js v18.12 or higher (current version v14.15.4 needs upgrading)
- npm, yarn, or pnpm package manager

### Installation

1. **Update Node.js** (required for package installation):
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   
   # Or download from https://nodejs.org/
   ```

2. **Install Dependencies**:
   ```bash
   # Using npm
   npm install
   
   # Using yarn
   yarn install
   
   # Using pnpm
   pnpm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory with the following variables:
   
   ```bash
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
   CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Set up Clerk Authentication**:
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com) and create a new application
   - Copy your publishable key and secret key
   - Replace the placeholder values in your `.env.local` file
   - Configure your allowed redirect URLs in Clerk dashboard:
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - After sign-in URL: `/`
     - After sign-up URL: `/`

5. **Set up Supabase** (if using):
   - Configure Supabase credentials in your environment variables
   - Set up your database schema using the provided SQL scripts in `/scripts`

### Development

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

### Recent Updates

#### File Upload Enhancement
- ✅ Enhanced file type detection and validation for `.txt` and `.md` files
- ✅ Improved user interface with processing states
- ✅ Added file metadata storage in database
- ⚠️ **DOCX support temporarily disabled** - Implementation needs fixes

#### Technical Changes
- **File Support**: Currently supports `.txt` and `.md` file uploads
- **API Updates**: Enhanced document creation API to handle file metadata
- **UI Improvements**: Better error handling and progress indicators
- **DOCX Implementation**: Commented out pending fixes (officeparser integration)

## Deployment

Your project is live at:

**[https://vercel.com/pranjals-projects-82cc138b/v0-word-wise-ai](https://vercel.com/pranjals-projects-82cc138b/v0-word-wise-ai)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/yDvEfAMV71m](https://v0.dev/chat/projects/yDvEfAMV71m)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## File Upload Flow

1. **File Selection**: Users can drag & drop or browse for supported files
2. **File Validation**: System checks file type and size
3. **Content Extraction**: 
   - Text/Markdown: Direct text reading
   - DOCX: ⚠️ Currently disabled (will be fixed later)
4. **Document Creation**: Saves content with metadata to database
5. **Display**: Shows documents with file type indicators

## Troubleshooting

### Package Installation Issues
If you encounter package installation errors:
1. Ensure Node.js version is 18.12 or higher
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and package-lock.json, then reinstall

### File Upload Issues
- **Unsupported File Type**: Currently only .txt and .md files are supported (.docx temporarily disabled)
- **Large File Sizes**: Check file size limits in your environment
- **DOCX Files**: Currently not supported - feature is being fixed for future release
