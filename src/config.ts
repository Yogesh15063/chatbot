
export const config = {
    apiUrl: process.env.NODE_ENV === 'production'
      ? 'https://chatbot-sa3r.onrender.com'
      : 'http://localhost:3000', // Fallback to localhost if undefined
  };
  