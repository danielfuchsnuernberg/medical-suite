import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App.jsx";
import SelectPopup from "./components/SelectPopup.jsx";

createRoot(document.getElementById("root")).render(<React.StrictMode><App /><SelectPopup /></React.StrictMode>);
