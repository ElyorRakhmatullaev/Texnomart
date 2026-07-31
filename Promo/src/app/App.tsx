import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/auth/AuthContext";
import { RoleProvider } from "./role-context";
import { CurrentUserProvider } from "./current-user-context";
import { ThemeProvider, useTheme } from "./theme-context";
import { router } from "./routes";

function ThemedToaster() {
  const { theme } = useTheme();
  // R73 (10-я часть): every toast is manually closable via the «×» and auto-hides
  // after a short time — so a toast can never sit over the working area/buttons.
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={5000}
      theme={theme}
    />
  );
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
