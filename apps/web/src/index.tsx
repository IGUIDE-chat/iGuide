import React from "react"
import ReactDOM from "react-dom/client"

import "./index.css"
import { BrowserRouter } from "react-router-dom"

import App from "./App"
import { AuthProvider } from "./contexts/AuthContext"

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Could not find root element to mount to")
}

const root = ReactDOM.createRoot(rootElement)
root.render(
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>,
)
