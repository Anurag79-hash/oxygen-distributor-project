
let currentLang = localStorage.getItem("lang") || "en";
const switchBtn = document.getElementById("langSwitch");
let translations={}
function toggleLanguage() {
  currentLang = currentLang === "en" ? "hi" : "en";
  localStorage.setItem("lang", currentLang);
  loadLanguage(currentLang);
  updateButtonText();
}

function updateButtonText() {
  switchBtn.innerText = currentLang === "en" ? "English" : "हिंदी";
}

function loadLanguage(lang) {
  fetch(`/lang/${lang}.json`)
    .then(res => res.json())
    .then(data => {
      translations=data
      // normal text
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (data[key]) el.innerText = data[key];
      });

      // placeholders
      document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (data[key]) el.placeholder = data[key];
      });
    });
}

function t(key, vars = {}) {
  let text = translations[key] || key;

  // handle {{variables}}
  Object.keys(vars).forEach(v => {
    text = text.replace(`{{${v}}}`, vars[v]);
  });

  return text;
}

// click event
switchBtn.addEventListener("click", toggleLanguage);

// auto-load on page load
document.addEventListener("DOMContentLoaded", () => {
  loadLanguage(currentLang);
  updateButtonText();
});

