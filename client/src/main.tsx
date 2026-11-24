import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { watchThaiBreaks } from './i18n/thaiBreak';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// กันเบราว์เซอร์ตัดบรรทัดกลางคำไทย (ดู i18n/thaiBreak.ts)
watchThaiBreaks(document.body);
