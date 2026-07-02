import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ToastContainer, Flip } from "react-toastify";
import store from "./components/stores/Store";
import { Provider } from "react-redux";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <ToastContainer pauseOnHover theme="dark" transition={Flip} />
      <App />
    </Provider>
  </BrowserRouter>,
);
