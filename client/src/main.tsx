import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SupabaseAuthProvider } from "./context/SupabaseAuthContext";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
</SupabaseAuthProvider>
      </QueryClientProvider>
    </Toaster>
  </StrictMode>
);