@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  background: #020617;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  min-height: 100vh;
  background: #020617;
}

body {
  color: #e2e8f0;
}

* {
  box-sizing: border-box;
}

button, input, textarea {
  font: inherit;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 999px;
}
