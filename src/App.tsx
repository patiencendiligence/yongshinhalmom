/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter } from "react-router-dom";
import MainApp from "./components/MainApp";
import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
