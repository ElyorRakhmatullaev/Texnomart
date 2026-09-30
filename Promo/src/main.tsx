// Режим кадра фильма — первым: подмены даты и хранилищ до любого кода приложения.
import "./film/frame-mode";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
