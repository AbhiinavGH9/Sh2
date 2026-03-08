# Setup Instructions for Audio Streamer

Welcome! This guide will help you set up and run the application locally step by step.

## 1. Install Dependencies
Before running the application, you need to install all the required Node.js packages. Open your terminal in the project folder and run:

```bash
npm install
```

## 2. Configure Environment Variables
You need a file named `.env` in the root of your project directory to strictly tell your app custom credentials.

1. Open the `.env` file you just created.
2. Ensure you have the following fields filled in:

```env
# The port the application will run on (Default is 5000)
PORT=5000

# Your PostgreSQL Database URL. You can get one from platforms like Supabase.
DATABASE_URL=postgresql://your_db_username:your_db_password@your_db_host:5432/your_db_name

# Tells the app it is running in local mode
NODE_ENV=development

# The URL of your local frontend
FRONTEND_URL=http://localhost:5173

# The name of your application
APP_NAME="Audio Streamer"

# Your Supabase Project URL
VITE_SUPABASE_URL="https://your-project.supabase.co"

# Your Supabase Anonymous Public Key
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

## 3. Configure Supabase Authentication
To allow users to log in, you must enable authentication providers in your Supabase dashboard:
1. Go to your Supabase Project Dashboard -> Authentication -> Providers.
2. Enable **Email** provider.
3. Enable **Google** provider (you will need to input your Google Cloud OAuth Client ID and Secret here).
4. Go to Authentication -> URL Configuration and add `http://localhost:5173` to your Site URL and Redirect URLs.

## 4. Push Database Schema (Only needed for new databases)
Once your `DATABASE_URL` is set, you need to sync the database tables to your remote database:

```bash
npm run db:push
```

## 4. Run the Application
Start the development server:

```bash
npm run dev
```

If everything is configured correctly, you should see messages indicating that the server is serving on `http://localhost:5000` (or whichever PORT you specified) and Vite is ready to serve the frontend!
