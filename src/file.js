export function saveToLocalStorage(names) {
  localStorage.setItem("names", JSON.stringify(names));
}
