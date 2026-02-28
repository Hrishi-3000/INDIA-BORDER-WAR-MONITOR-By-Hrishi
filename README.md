# India Border War Monitor

## Deployment to Vercel

This project is ready to be deployed to Vercel. Follow these steps:

1.  **Push to GitHub**: Ensure this project is pushed to a GitHub repository.
2.  **Import to Vercel**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click "Add New..." -> "Project".
    *   Import your GitHub repository.
3.  **Configure Environment Variables**:
    *   In the "Environment Variables" section of the deployment configuration:
    *   Add `GEMINI_API_KEY` with your Google Gemini API Key.
    *   (Optional) If you have other keys, add them here.
4.  **Deploy**: Click "Deploy".

### Build Settings (Auto-detected)
*   **Framework Preset**: Vite
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`

## Local Development

1.  Clone the repository.
2.  Run `npm install`.
3.  Create a `.env` file with `GEMINI_API_KEY=your_key_here`.
4.  Run `npm run dev`.
