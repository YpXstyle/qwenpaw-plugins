import { registerPlugin } from "./register";

const registration = registerPlugin(window.QwenPaw);

export function dispose() {
  registration.dispose();
}

if (import.meta.hot) import.meta.hot.dispose(dispose);
