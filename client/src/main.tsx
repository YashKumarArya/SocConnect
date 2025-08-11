import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler to prevent unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection caught:', event.reason);
  event.preventDefault(); // Prevent default browser behavior
});

// Global error handler for runtime errors
window.addEventListener('error', (event) => {
  console.warn('Global error caught:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
