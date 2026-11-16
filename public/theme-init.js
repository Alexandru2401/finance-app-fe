// Applies the saved theme before React renders, to avoid a flash of the wrong theme.
// Kept as a separate file (not inline in index.html) so the CSP can stay "script-src 'self'".
try {
  var t = localStorage.getItem("theme");
  if (t !== "light" && t !== "dark") {
    t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.classList.toggle("dark", t === "dark");
  document.documentElement.style.colorScheme = t;
} catch (e) {}
