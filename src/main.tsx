import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "@m1kapp/kit";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
