import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import MainApp from "./components/MainApp";
import { ThemeProvider } from "./lib/ThemeContext";
import { AuthProvider } from "./lib/AuthContext";

export function render(url: string) {
  const helmetContext: { helmet?: any } = {};

  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <MemoryRouter initialEntries={[url]}>
        <ThemeProvider>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;

  return {
    appHtml,
    helmet,
  };
}
