import { RouterProvider } from "react-router"
import { Toaster } from "sonner"
import { ScoringFlowProvider } from "./scoring-flow"
import { router } from "./routes"

export default function App() {
  return (
    <ScoringFlowProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </ScoringFlowProvider>
  )
}
