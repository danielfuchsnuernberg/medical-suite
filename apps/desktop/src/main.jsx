import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App.jsx";
import SelectPopup from "./components/SelectPopup.jsx";

createRoot(document.getElementById("root")).render(<React.StrictMode><App /><SelectPopup />{window.md && window.md.trial ? <div className="trial-stripe" data-testid="trial-stripe" role="note">REAL DATA · trial on this Mac</div> : null}</React.StrictMode>);
