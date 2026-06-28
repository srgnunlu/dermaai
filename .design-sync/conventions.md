# Building with CorioScan

CorioScan's UI is a **shadcn/ui** component library on a custom Tailwind theme (clinical
teal brand, light + dark). Build screens by **composing these components**; they ship fully
styled from `_ds_bundle.js` + `styles.css`. Import everything from `corioscan-ui`.

## Setup
- **No provider needed.** Theming is CSS-variable based — components read tokens from `:root`
  in the shipped stylesheet. Just import and render.
- **Dark mode**: add `class="dark"` to any ancestor; every token flips automatically.
- **Tooltip** is the one exception that needs a context wrapper: put usages inside
  `<TooltipProvider>` once, high in the tree.

## Styling idiom — variant props, then theme utilities, then CSS tokens
1. **Appearance comes from props, not restyling.** The variant axes that carry the brand:
   `Button` `variant` = `default | secondary | destructive | outline | ghost | link`,
   `size` = `default | sm | lg | icon`; `Badge` `variant` = `default | secondary | destructive | outline`.
   Reach for these before adding classes.
2. **Layout glue: Tailwind utilities** that resolve against this theme. Confirmed present in the
   shipped stylesheet — semantic colors: `bg-primary` `text-primary-foreground` `bg-secondary`
   `bg-card` `text-card-foreground` `bg-muted` `text-muted-foreground` `bg-accent` `bg-destructive`
   `bg-background` `text-foreground` `bg-popover`; layout: `flex` `flex-col` `grid` `items-center`
   `justify-between` `gap-1` `gap-2` `gap-4` `space-y-2` `p-4` `px-3` `py-2` `w-full` `border`
   `rounded-md` `rounded-lg` `shadow-sm` `text-sm` `text-lg` `font-medium` `font-semibold`.
3. **For anything outside that set** (arbitrary widths, custom spacing) use the **CSS variables**
   directly in `style={{}}` — always defined, never purged: `var(--primary)` `var(--secondary)`
   `var(--muted-foreground)` `var(--foreground)` `var(--border)` `var(--destructive)` `var(--success)`
   `var(--accent)` `var(--card)` `var(--popover)` `var(--ring)` `var(--radius)` `var(--font-sans)`
   `var(--font-display)`. Do NOT invent classes the theme doesn't ship (e.g. arbitrary `w-[360px]`);
   use `style={{ width: 360 }}` instead.

## Where the truth lives
- Stylesheet (tokens + the exact utility set that ships): `_ds/<folder>/styles.css` → its
  `@import "./_ds_bundle.css"`. Read it before styling.
- Per component: `<Name>.d.ts` (prop contract) and `<Name>.prompt.md` (usage + examples). Compound
  components (Dialog, AlertDialog, Select, DropdownMenu, Popover, Card, Table, Form, Tabs, Accordion…)
  compose several exported parts — the `.prompt.md` shows the full composition.

## Idiomatic example
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from 'corioscan-ui';

export function CaseCard() {
  return (
    <Card style={{ width: 360 }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lesion #A-1042</CardTitle>
          <Badge variant="destructive">High risk</Badge>
        </div>
        <CardDescription>Right forearm · 18 Jun 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Asymmetric border with colour variation. Specialist review recommended.
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm">Open case</Button>
        <Button size="sm" variant="outline">Dismiss</Button>
      </CardFooter>
    </Card>
  );
}
```
