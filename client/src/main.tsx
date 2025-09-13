import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Main.tsx is loading...");
const rootElement = document.getElementById("root");
console.log("Root element found:", rootElement);

createRoot(rootElement!).render(<App />);
