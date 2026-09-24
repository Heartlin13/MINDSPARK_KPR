# RESQ-MIND

ResQ-Mind is a multi-agent disaster response coordination platform for simulated live incident monitoring, resource allocation, and response planning.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in a local `.env` file to your Gemini API key.
3. Run the app:
   `npm run dev`

## Satellite Monitoring

Satellite integration is server-side only. Set `SATELLITE_API_URL` and `SATELLITE_API_KEY` to a provider endpoint that returns normalized JSON with an `observations` array containing `zoneId`, `floodStatus` (`low`, `medium`, or `high`), `waterSpread` (0-100), `confidence` (0-1), and `timestamp`.

The application exposes:

- `GET /api/satellite/status`
- `GET /api/satellite/observations`

When those variables are absent or the provider is unavailable, the existing disaster simulator remains active and responses are labeled `SIMULATED DATA`. The app does not present synthetic observations as satellite data.
