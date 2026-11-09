import type { Code, ValidationRule } from '../types';
interface CssRule {
  selector: string;
  style: CSSStyleDeclaration;
  media: boolean;
  order: number;
}
// Parse CSS through the browser CSSOM. The stylesheet never applies to the application.
export function parseStyles(css: string): CssRule[] {
  const style = document.createElement('style');
  let sheet: CSSStyleSheet | null = null;
  style.media = 'not all';
  // Imports cannot participate in a self-contained exercise. Remove them before parsing.
  style.textContent = css.replace(
    /@import\s+(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/gi,
    '',
  );
  if (
    typeof CSSStyleSheet !== 'undefined' &&
    'replaceSync' in CSSStyleSheet.prototype
  ) {
    sheet = new CSSStyleSheet();
    try {
      sheet.replaceSync(style.textContent);
    } catch {
      return [];
    }
  } else {
    document.head.append(style);
    sheet = style.sheet;
  }
  const output: CssRule[] = [];
  const walk = (rules: CSSRuleList, media = false) => {
    for (const r of Array.from(rules)) {
      if ('selectorText' in r) {
        const rule = r as CSSStyleRule;
        output.push({
          selector: rule.selectorText,
          style: rule.style,
          media,
          order: output.length,
        });
      } else if ('cssRules' in r) {
        const condition = (r as CSSMediaRule).conditionText || '';
        if (!condition || /(?:max-width|width\s*<=)/i.test(condition))
          walk((r as CSSMediaRule).cssRules, media || !!condition);
      }
    }
  };
  try {
    if (sheet) walk(sheet.cssRules);
  } catch {
    /* Invalid CSS yields actionable failed checks below. */
  }
  style.remove();
  return output;
}
const nonzero = (value: string) =>
  value.trim() &&
  !/^(?:0(?:px|rem|em|%)?\s*)+$/.test(value.trim()) &&
  !['none', 'normal', 'initial', 'unset', 'inherit'].includes(value.trim());
function declaration(style: CSSStyleDeclaration, property: string) {
  let value = style.getPropertyValue(property).trim();
  if (!value && property === 'background-color')
    value = style.getPropertyValue('background').trim();
  if (!value && property === 'gap')
    value =
      style.getPropertyValue('column-gap').trim() ||
      style.getPropertyValue('row-gap').trim();
  if (!value && property === 'padding')
    value = ['top', 'right', 'bottom', 'left']
      .map((p) => style.getPropertyValue(`padding-${p}`))
      .filter(Boolean)
      .join(' ');
  if (
    value &&
    typeof CSS !== 'undefined' &&
    CSS.supports &&
    !CSS.supports(property, value) &&
    !(property === 'background-color' && CSS.supports('background', value))
  )
    return '';
  return value;
}
function specificity(selector: string): number {
  return (
    (selector.match(/#[\w-]+/g)?.length || 0) * 100 +
    (selector.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/g)?.length || 0) * 10 +
    (selector.match(/(^|[\s>+~])\w+/g)?.length || 0)
  );
}
function effective(
  el: Element,
  property: string,
  rules: CssRule[],
  media: boolean,
) {
  let value = '';
  let rank = -1;
  for (const r of rules) {
    if (r.media !== media) continue;
    for (const selector of r.selector.split(',')) {
      try {
        if (el.matches(selector.trim())) {
          const v = declaration(r.style, property);
          const score =
            specificity(selector) +
            (r.style.getPropertyPriority(property) ? 10000 : 0);
          if (v && score >= rank) {
            rank = score;
            value = v;
          }
        }
      } catch {
        /* Ignore unsupported selectors. */
      }
    }
  }
  const inline = (el as HTMLElement).style;
  if (inline && declaration(inline, property) && rank < 10000 && !media)
    value = declaration(inline, property);
  return value;
}
export function validateCode(code: Code, rules: ValidationRule[]) {
  const doc = new DOMParser().parseFromString(code.html, 'text/html');
  const parsed = parseStyles(
    code.css +
      '\n' +
      [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n'),
  );
  return rules.map((rule) => {
    let elements: Element[] = [];
    try {
      elements = [...doc.querySelectorAll(rule.selector)];
    } catch {
      /* Invalid authored selector. */
    }
    let passed = false;
    if (rule.property) {
      passed = elements.some((el) => {
        const value = effective(el, rule.property!, parsed, false);
        if (rule.responsive)
          return (
            ['wrap', 'wrap-reverse'].includes(value) ||
            ['column', 'column-reverse'].includes(
              effective(el, 'flex-direction', parsed, true),
            )
          );
        if (rule.expected) return rule.expected.includes(value);
        return (
          !!nonzero(value) &&
          (rule.property !== 'background-color' || value !== 'transparent')
        );
      });
    } else {
      const valid = elements.filter((el) => {
        if (rule.text && !el.textContent?.trim()) return false;
        if (rule.different && el.textContent?.trim() === rule.different)
          return false;
        if (rule.attribute) {
          const attr = el.getAttribute(rule.attribute)?.trim();
          if (!attr) return false;
          if (rule.value && attr.toLowerCase() !== rule.value.toLowerCase())
            return false;
          if (
            ['href', 'src'].includes(rule.attribute) &&
            /^(?:javascript|vbscript):/i.test(attr)
          )
            return false;
        }
        return true;
      });
      passed = valid.length >= (rule.min || 1);
    }
    return { message: rule.message, passed };
  });
}
export function answersMatch(answer: number[], correct: number[]) {
  return (
    answer.length === correct.length &&
    [...answer].sort().every((v, i) => v === [...correct].sort()[i])
  );
}
