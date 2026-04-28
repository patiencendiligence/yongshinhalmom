/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter } from "react-router-dom";
import MainApp from "./components/MainApp";
import { AuthProvider } from "./lib/AuthContext";

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </HashRouter>
  );
}
