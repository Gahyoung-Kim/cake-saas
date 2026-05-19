import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-ko)',
            fontSize: '13px',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            border: '0.5px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
