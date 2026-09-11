# Tenant White-Label Branding Engine

## White-Label Customization

Adyapan Lending OS supports complete visual and institutional white-labeling per tenant:

```text
               Authenticated User / Borrower Session
                                  │
                                  ▼
                     Resolve Active `tenantId`
                                  │
                                  ▼
                 `brandingService.getTenantBranding(tenantId)`
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
[Brand Identity]           [Styling Tokens]            [Portals & Domains]
• Institution Name         • Primary Color             • Custom Domain
• Slogan / Tagline         • Secondary Color           • Portal Title
• Logo Asset URL           • Accent Color              • Email Signature
• Favicon URL              • WCAG Contrast >= 4.5:1    • Support Contact
```

### WCAG 2.1 Contrast Safety
The branding engine calculates relative luminance and validates color contrast against white:
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$
- Minimum required for graphical elements: **3.0:1**
- Minimum required for text: **4.5:1**
- Submitting colors with contrast below 2.5:1 raises a `BadRequestError` with clear guidance.
