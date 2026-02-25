import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## 🗂 Step 3: Your Final File Structure

After replacing, your `src/` should look like this:
```
disney-vault/
├── src/
│   ├── App.jsx       ← replace with code above
│   ├── App.css       ← replace with code above
│   └── main.jsx      ← replace with code above
├── index.html        ← leave as-is (Vite generates this)
├── package.json      ← leave as-is
└── vite.config.js    ← leave as-is