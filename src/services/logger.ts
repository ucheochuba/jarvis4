// Simple console logger
const logger = {
  info: (message: string, data?: any) => {
    console.log(message, data || '');
  },
  error: (message: string, data?: any) => {
    console.error(message, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(message, data || '');
  }
};

export default logger; 