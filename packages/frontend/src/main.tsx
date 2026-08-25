import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './App';
import './index.css';

(window as any).__nexusBooted = true;
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
