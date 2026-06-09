import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/auth/AuthContext";
import { RoleProvider } from "./role-context";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </RoleProvider>
    </AuthProvider>
  );
}
