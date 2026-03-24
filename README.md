# ADAR Admin Dashboard

The ADAR Admin Dashboard is a comprehensive web interface designed for administrators to manage and verify citizen reports, monitor system health, and track key metrics for the ADAR platform.

## Features

- **User Authentication**: Secure login mechanism to protect administrative functions.
- **Dashboard Analytics**: Real-time insights and metrics, including total active users, new mobile app installs, and report statistics (visualized with Recharts).
- **Citizen Reports Management**: Detailed table view of all incoming citizen reports with sorting and filtering capabilities.
- **Photo Verification**: Specialized interface for reviewing and verifying submitted photos for authenticity.
- **Admin Map**: High-detail mapping integration (using Leaflet and Google Maps tiles) synchronized with the mobile app for precise location tracking of reports.
- **System Health Monitoring**: Real-time tracking of platform status and flagged alerts.
- **Responsive Design**: Mobile-friendly sidebar and UI elements optimized for various screen sizes (built with Tailwind CSS).

## Tech Stack

This project is built using modern web development technologies:

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & Framer Motion
- **Routing**: React Router DOM
- **Maps**: Leaflet & React Leaflet
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend/Services Integration**: Supabase & Firebase

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your machine.

### Installation

1. Navigate to the admin project directory:
   ```bash
   cd ADAR_Admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the example environment file and fill in your Supabase, Firebase, and other necessary API credentials:
   ```bash
   cp .env.example .env
   ```

### Running the Application

To start the development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173` (by default).

### Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```
