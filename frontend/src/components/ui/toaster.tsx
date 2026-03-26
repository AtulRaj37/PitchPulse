'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex items-center gap-3 w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl',
          title: 'text-zinc-100 font-medium',
          description: 'text-zinc-400 text-sm',
          success: 'bg-green-500/10 border-green-500/30',
          error: 'bg-red-500/10 border-red-500/30',
          warning: 'bg-yellow-500/10 border-yellow-500/30',
          info: 'bg-blue-500/10 border-blue-500/30',
          actionButton: 'bg-primary-500 text-white',
          cancelButton: 'bg-zinc-800 text-zinc-400',
        },
      }}
      theme="dark"
      richColors
      closeButton
    />
  );
}
