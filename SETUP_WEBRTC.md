# WebRTC Intercom Setup Guide

Welcome! WebRTC (Web Real-Time Communication) is the technology bridging the audio connections between you and other users on the `Sh2` command interface.

If your dashboard says **"WebRTC: WAITING"**, it means your local browser is currently broadcasting your microphone, but it is waiting for another peer to join the same frequency signal. 

Follow these steps exactly to test the voice-chat functionality.

## Step 1: Open Two Separate Browsers
To test WebRTC locally, you need two distinct users. Because Supabase records your login session globally in one browser, the easiest way to test this is to:
1. Open Google Chrome (or your primary browser) and navigate to `http://localhost:5000`. Login with Account A.
2. Open an Incognito Window (or a different browser like Firefox/Edge) and navigate to `http://localhost:5000`. Login with Account B.

## Step 2: Grant Microphone Permissions
WebRTC requires explicit permission to use your microphone. 
1. In both browser windows, ensure you `ALLOW` the browser to use your microphone when the prompt appears near the URL bar.
2. If you accidentally blocked it, click the lock icon 🔒 next to `localhost:5000` in your address bar and toggle Microphone to `Allow`, then refresh the page.

## Step 3: Sync the Frequencies
WebRTC peers only connect if they share the exact same radio tunnel.
1. On Browser A, create a new Channel or set the Frequency dial to `144.20 MHz` and click **"INITIATE LINK"**.
2. Wait until the `Link Status` pill flashes green to "ACTIVE".
3. On Browser B, set the Frequency dial to the exact same numbers, `144.20 MHz` and click **"INITIATE LINK"**.

## Step 4: Verify Connection
1. Wait a few seconds for the signaling server to exchange connection handshakes.
2. The WebRTC pill in the top right of both browsers should change from **WAITING** to **1 PEER(S) OK**.
3. Speak into your microphone on Browser A. You should hear the audio playback on Browser B! (Beware of audio feedback loops if your speakers are loud).

## Common Troubleshooting
* **WebRTC never connects:** Ensure both tabs are definitely on the identical frequency number. 
* **Still no audio:** Check your OS system settings to ensure it isn't muting your microphone globally or denying Chrome access to it.
* **Why does it only work on localhost?** If you deploy this app to a live server later on without an SSL certificate (HTTP instead of HTTPS), browsers will strictly block the microphone `getUserMedia` API for security. Live deployments *must* be protected via HTTPS. Locally, `localhost` is treated as a secure context automatically.
