export const AppConfig = {
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL || "",
    NODE_ENV: process.env.NODE_ENV || "development",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    APP_NAME: process.env.APP_NAME || "Audio Streamer",
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
};
