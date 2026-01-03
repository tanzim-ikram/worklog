# WorkLog - Time Tracker

A simple, lightweight time-tracking web application built with Next.js, TypeScript, and Supabase.

## Features

- **Timer**: Start, pause, resume, and stop work sessions
- **Session Tracking**: Automatic tracking of work segments with start/end times
- **Daily/Weekly/Monthly Views**: View your work time summaries
- **Calendar Grid**: Visual month view showing daily totals
- **Export**: Export monthly reports as CSV or PDF
- **Session Editing**: Manually adjust session times and notes
- **Timezone Support**: Configure your timezone for accurate day grouping
- **Authentication**: Secure email/password authentication via Supabase

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Date Handling**: date-fns + date-fns-tz

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and publishable default key from Settings > API

### 2. Clone and Install

```bash
cd worklog
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_default_key
```

### 4. Run Database Migrations

**Option 1: Quick Setup (Recommended)**

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/000_combined_setup.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify success - you should see "Success. No rows returned"

**Option 2: Individual Migrations**

If you prefer to run migrations separately:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_create_profile_trigger.sql`

**Option 3: Using Supabase CLI**

If you have the Supabase CLI installed:

```bash
supabase db push
```

**Verify Tables Were Created:**

After running the migrations, verify everything is set up correctly:

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - `profiles`
   - `projects`
   - `work_sessions`
   - `work_segments`

Or run the verification script:

1. Go to **SQL Editor**
2. Copy and paste the contents of `supabase/verify_setup.sql`
3. Click **Run**
4. Review the results - all items should show "✓ EXISTS" or "✓ ENABLED"

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
worklog/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── timer/         # Timer endpoints
│   │   ├── summary/       # Summary endpoints
│   │   ├── export/        # Export endpoints
│   │   └── sessions/     # Session management
│   ├── app/               # Protected app pages
│   │   ├── day/          # Day view
│   │   ├── week/         # Week view
│   │   ├── month/        # Month view with calendar
│   │   └── settings/    # Settings page
│   ├── login/            # Login page
│   └── signup/           # Signup page
├── components/            # React components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client setup
│   └── utils/            # Utility functions
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
└── __tests__/            # Test files
```

## Database Schema

### Tables

- **profiles**: User profiles with timezone preferences
- **work_sessions**: Logical work sessions (one per day typically)
- **work_segments**: Individual time segments (start/end times)
- **projects**: Optional project categorization

### Key Constraints

- One running segment per user (enforced by unique partial index)
- Row Level Security (RLS) ensures users only access their own data
- Automatic profile creation on user signup

## API Endpoints

### Timer
- `POST /api/timer/start` - Start a new timer
- `POST /api/timer/pause` - Pause the running timer
- `POST /api/timer/resume` - Resume a paused timer
- `POST /api/timer/stop` - Stop the timer
- `GET /api/timer/status` - Get current timer status

### Summaries
- `GET /api/summary/day?date=YYYY-MM-DD` - Get day summary
- `GET /api/summary/week?start=YYYY-MM-DD` - Get week summary
- `GET /api/summary/month?month=YYYY-MM` - Get month summary
- `GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` - Get calendar data

### Exports
- `GET /api/export/month.csv?month=YYYY-MM` - Export CSV
- `GET /api/export/month.pdf?month=YYYY-MM` - Export PDF

### Sessions
- `PATCH /api/sessions/:id` - Update session (note, times)

## Usage

### Starting a Timer

1. Navigate to the Dashboard
2. Click "Start" to begin tracking
3. The timer will show elapsed time in real-time

### Pausing and Resuming

- Click "Pause" to temporarily stop the timer
- Click "Resume" to continue the same session
- Click "Stop" to end the session completely

### Viewing Summaries

- **Day View**: See all sessions for a specific day
- **Week View**: See daily totals for a week
- **Month View**: See calendar grid with daily totals and export options

### Editing Sessions

1. Navigate to a day view
2. Click "Edit" on any session
3. Adjust start/end times or add/edit notes
4. Save changes

### Exporting Reports

1. Navigate to Month View
2. Select the desired month
3. Click "Export CSV" or "Export PDF"
4. Reports include daily totals and session details

## Timezone Handling

- All timestamps are stored in UTC in the database
- The `local_date` field stores the date in the user's timezone
- User timezone is configurable in Settings
- Summaries group sessions by `local_date` for accurate day boundaries

## Testing

Run tests with:

```bash
npm test
```

Current test coverage includes:
- Timezone utility functions
- Duration formatting
- Timer state transitions (placeholder tests)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Ensure Node.js 18+ is available
- Set environment variables
- Run `npm run build` and `npm start`

## Important Notes

### Multiple Tabs

- Only one running segment is allowed per user
- If you start a timer in one tab, starting in another will show an error
- The timer status syncs every 5 seconds across tabs

### Day Boundaries

- Sessions are assigned to the day based on the user's timezone at session start
- If a session crosses midnight in the user's timezone, it's assigned to the start date
- Summaries use the current user timezone for grouping

### DST (Daylight Saving Time)

- The app uses timezone-aware date handling
- DST transitions are handled automatically by date-fns-tz

## Troubleshooting

### "Timer already running" error

- Check if you have a timer running in another tab
- Refresh the page to sync state
- If the issue persists, manually stop the timer via the database

### Timezone not updating

- Ensure you've saved settings after changing timezone
- Refresh the page
- New sessions will use the updated timezone

### Export not working

- Ensure you have sessions for the selected month
- Check browser console for errors
- PDF generation requires jsPDF (included in dependencies)

## License

MIT

## Contributing

This is a personal project, but suggestions and improvements are welcome!
