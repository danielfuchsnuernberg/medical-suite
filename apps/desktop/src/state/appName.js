// B61: the program's name comes from Settings (Country and base › Program name). Screens read it here; the window title follows.
import { PROGRAM_NAME } from "@md/core";
let name = PROGRAM_NAME;
export const appName = () => name;
export function setAppName(n) { name = n || PROGRAM_NAME; if (typeof document !== "undefined" && document.title !== name) document.title = name; }
