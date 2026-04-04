// Angular-style component (plain JS shape for static analysis).
import { DomSanitizer } from "@angular/platform-browser";

export class BypassComponent {
  /** @param {DomSanitizer} sanitizer */
  constructor(sanitizer) {
    this.sanitizer = sanitizer;
  }
  bind(fragment) {
    return this.sanitizer.bypassSecurityTrustHtml(fragment);
  }
}
