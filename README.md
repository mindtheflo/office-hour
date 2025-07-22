# Office Hour Scheduler


## Overview

This is a Next.js application for managing and scheduling office hours. It provides a public interface to view upcoming office hours and an admin dashboard to configure schedules, set date overrides, and manage settings. The application uses Supabase for data storage and is designed to be deployed on Vercel.

## Features

- Display upcoming office hours with countdown timer
- Add office hours to calendar
- Join Zoom meetings (within time window)
- Admin dashboard for managing weekly schedules and date-specific overrides
- Timezone support
- Tracking of calendar additions
- Responsive design using Shadcn/UI components

## Tech Stack

- Next.js 15
- React 19
- Supabase
- Tailwind CSS
- Shadcn/UI
- Lucide Icons
- Date-fns

## Prerequisites

- Node.js 18 or higher
- Supabase account
- Vercel account (for deployment)

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/mindtheflo/office-hour.git
   cd office-hour
   ```

2. Install dependencies:
   ```
   npm install
   ```
   (Note: The project has both package-lock.json and pnpm-lock.yaml; you may use npm or pnpm.)

3. Set up environment variables. Create a `.env.local` file in the root and add the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ADMIN_PASSWORD=your_secure_admin_password_here
   ```
   Replace with your actual Supabase credentials and a secure admin password.

4. Set up the Supabase database:
   - Create a new Supabase project.
   - Run the SQL scrips in the `scripts/` directory using the Supabase SQL editor.

5. Run the development server:
   ```
   npm run dev
   ```
   The app will be available at http://localhost:3002

## Usage

- Public page: `/` - View upcoming office hours
- Admin login: `/admin` - Login with the ADMIN_PASSWORD
- Admin dashboard: `/admin/dashboard` - Manage configurations

## Deployment

1. Push the repository to GitHub.
2. Connect to Vercel and deploy.
3. Set the environment variables in Vercel dashboard.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

Note: If there's no LICENSE file, add one.
