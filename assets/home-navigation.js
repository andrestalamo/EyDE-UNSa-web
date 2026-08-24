(() => {
  if (document.querySelector(".eyde-home-link")) return;

  const homeLink = document.createElement("a");
  homeLink.className = "eyde-home-link";
  homeLink.href = "../../";
  homeLink.title = "Volver a clases";
  homeLink.setAttribute("aria-label", "Volver a clases");
  homeLink.textContent = "⌂";
  document.body.appendChild(homeLink);
})();
