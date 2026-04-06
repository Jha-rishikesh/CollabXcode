import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

// Humne jo .env mein Client ID daali thi, ye line usko yahan load karegi
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Is Provider se wrap karne ka matlab hai ki ab poore app mein Google Login kaam karega */}
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)