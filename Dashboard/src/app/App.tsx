import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/auth/AuthContext";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
