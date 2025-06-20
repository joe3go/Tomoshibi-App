import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { SupabaseAuthProvider } from "./context/SupabaseAuthContext";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <App />
        <Toaster />
      </SupabaseAuthProvider>
    </QueryClientProvider>
  </StrictMode>
);