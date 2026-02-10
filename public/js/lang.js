
let currentLang = localStorage.getItem("lang") || "en";
const switchBtn = document.getElementById("langSwitch");

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

// click event
switchBtn.addEventListener("click", toggleLanguage);

// auto-load on page load
document.addEventListener("DOMContentLoaded", () => {
  loadLanguage(currentLang);
  updateButtonText();
});

