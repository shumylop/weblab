import type { Code } from '../types';
const illustration =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300"><rect width="480" height="300" rx="24" fill="#e6e0ff"/><circle cx="350" cy="80" r="38" fill="#ffe399"/><path d="M0 280 150 80l110 150 60-80 160 130" fill="#7560c9"/><path d="m150 80 36 50h-72" fill="white"/></svg>';
export function buildDocument(code: Code, preview = true) {
  const doc = new DOMParser().parseFromString(code.html, 'text/html');
  doc
    .querySelectorAll(
      'script, iframe, object, embed, base, link, meta[http-equiv]',
    )
    .forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (
        /^on/i.test(attr.name) ||
        /^(javascript|vbscript):/i.test(attr.value.trim())
      )
        el.removeAttribute(attr.name);
    }
  });
  doc.querySelectorAll('img').forEach((img) => {
    if (/(^|\/)hobby\.svg$/.test(img.getAttribute('src') || ''))
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(illustration)}`;
  });
  const style = doc.createElement('style');
  style.textContent = code.css.replace(/</g, '\\3c ');
  doc.head.append(style);
  if (preview) {
    const csp = doc.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content =
      "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: https:; font-src 'none'; form-action 'none'; base-uri 'none'";
    doc.head.prepend(csp);
  }
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
