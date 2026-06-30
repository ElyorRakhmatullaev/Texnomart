import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/auth/AuthContext";
import { RoleProvider } from "./role-context";
import { CurrentUserProvider } from "./current-user-context";
import { ThemeProvider, useTheme } from "./theme-context";
import { router } from "./routes";

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster position="top-right" richColors theme={theme} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <CurrentUserProvider>
            <RouterProvider router={router} />
            <ThemedToaster />
          </CurrentUserProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
