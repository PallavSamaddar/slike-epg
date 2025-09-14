// Global error handler for browser extension errors
export const setupErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Check if it's a browser extension error
    if (error?.message?.includes('message channel closed') || 
        error?.message?.includes('asynchronous response')) {
      console.debug('Browser extension error caught and handled:', error.message);
      event.preventDefault(); // Prevent the error from being logged
      return;
    }
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    // Check if it's a browser extension error
    if (error?.message?.includes('message channel closed') || 
        error?.message?.includes('asynchronous response')) {
      console.debug('Browser extension error caught and handled:', error.message);
      event.preventDefault(); // Prevent the error from being logged
      return;
    }
  });

  // Handle console errors from extensions
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Filter out browser extension errors
    if (message.includes('message channel closed') || 
        message.includes('asynchronous response')) {
      console.debug('Browser extension error filtered:', message);
      return;
    }
    
    // Log other errors normally
    originalConsoleError.apply(console, args);
  };
};
