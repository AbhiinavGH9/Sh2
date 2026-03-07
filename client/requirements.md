## Packages
framer-motion | Page animations, smooth dial transitions, and speaking pulse effects
qrcode.react | Generating QR codes for Duo Mode invite links (optional but adds polish)

## Notes
Tailwind Config - extend fontFamily and colors:
fontFamily: {
  display: ["Orbitron", "sans-serif"],
  body: ["Inter", "sans-serif"],
  mono: ["Space Mono", "monospace"],
},
colors: {
  neon: {
    green: "hsl(111 100% 54%)",
    orange: "hsl(36 100% 50%)",
    red: "hsl(354 100% 50%)",
  }
}

The backend WebSocket connects to `/ws`.
Message format expected: `JSON.stringify({ type: eventName, payload: data })`
Authentication relies on `/api/auth/user` (Replit Auth).
