---
paths:
  - "src/components/**"
  - "src/pages/**"
---

# Component patterns & reference

All components are built on **React Aria Components** (compound pattern with sub-components like `Select.Item`, `Select.ComboBox`). TypeScript throughout.

## Styling architecture
- `cx()` (from `@/utils/cx`) — class name utility
- `sortCx()` — organized style objects
- `isReactComponent()` (from `@/utils/is-react-component`) — component type checking
- Size variants: `sm`, `md`, `lg`, `xl`; color variants: `primary`, `secondary`, `tertiary`, `destructive`, …
- Default small transitions: `transition duration-100 ease-linear`
- **Disabled states use `opacity-50`** (v8): `disabled:cursor-not-allowed disabled:opacity-50`. Do NOT use v7 tokens like `disabled:bg-disabled_subtle`.

```typescript
export const styles = sortCx({
    common: { root: "base-classes", icon: "icon-classes" },
    sizes: { sm: { root: "small" }, md: { root: "medium" } },
    colors: { primary: { root: "primary" }, secondary: { root: "secondary" } },
});
```

## Component props pattern
```typescript
interface CommonProps { size?: "sm" | "md" | "lg"; isDisabled?: boolean; isLoading?: boolean; }
interface ButtonProps extends CommonProps, HTMLButtonElement {
    color?: "primary" | "secondary" | "tertiary";
    iconLeading?: FC | ReactNode;
    iconTrailing?: FC | ReactNode;
}
```

## Compound components
```typescript
const Select = SelectComponent as typeof SelectComponent & { Item: typeof SelectItem; ComboBox: typeof ComboBox };
Select.Item = SelectItem;
Select.ComboBox = ComboBox;
```

## Conditional rendering
```typescript
{label && <Label isRequired={isRequired}>{label}</Label>}
{hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
```

## When adding a component
Follow existing structure; build on React Aria; full TS types; add size/color variants; include a11y; kebab-case file; place in the right folder (`base/`, `application/`, `foundations/`, …).

---

# Most-used components

### Button — `@/components/base/buttons/button`
Props: `size` (`xs|sm|md|lg|xl`, default `sm`), `color` (`primary|secondary|tertiary|link-gray|link-color|primary-destructive|secondary-destructive|tertiary-destructive|link-destructive`), `iconLeading`/`iconTrailing` (FC | ReactNode), `isDisabled`, `isLoading`, `showTextWhileLoading`, `children`.
```typescript
<Button size="md">Save</Button>
<Button iconLeading={Check} color="primary">Save</Button>
<Button isLoading showTextWhileLoading>Submitting…</Button>
<Button color="primary-destructive" iconLeading={Trash02}>Delete</Button>
```

### Input — `@/components/base/input/input` (+ `input-group`)
Props: `size` (`sm|md|lg`, default `md`), `label`, `placeholder`, `hint`, `tooltip`, `icon` (FC), `isRequired`, `isDisabled`, `isInvalid`.
```typescript
<Input label="Email" placeholder="olivia@untitledui.com" />
<Input icon={Mail01} label="Email" isRequired isInvalid hint="Please enter a valid email" />
<InputGroup label="Website" trailingAddon={<Button>Copy</Button>}><InputBase placeholder="www.untitledui.com" /></InputGroup>
```

### Select / MultiSelect — `@/components/base/select/select` (`multi-select`)
Props: `size`, `label`, `placeholder`, `hint`, `tooltip`, `items`, `isRequired`, `isDisabled`, `icon`. Item props: `id`, `supportingText`, `icon`, `avatarUrl`, `isDisabled`.
```typescript
<Select label="Team member" placeholder="Select member" items={users}>
  {(item) => <Select.Item id={item.id} supportingText={item.email}>{item.name}</Select.Item>}
</Select>
<Select.ComboBox label="Search" placeholder="Search users" items={users}>
  {(item) => <Select.Item id={item.id}>{item.name}</Select.Item>}
</Select.ComboBox>
```

### Checkbox — `@/components/base/checkbox/checkbox`
Props: `size` (`sm|md`), `label`, `hint`, `isSelected`, `isDisabled`, `isIndeterminate`.
```typescript
<Checkbox label="Remember me" hint="Save my login details" />
<Checkbox isSelected={checked} onChange={setChecked} />
```

### Badge — `@/components/base/badges/badges`
`Badge`, `BadgeWithDot`, `BadgeWithIcon`. Props: `size` (`sm|md|lg`), `color` (gray|brand|error|warning|success|slate|sky|blue|indigo|purple|pink|rose|orange), `type` (`pill-color|color|modern`).
```typescript
<Badge color="brand" size="md">New</Badge>
<BadgeWithDot color="success" type="pill-color">Active</BadgeWithDot>
<BadgeWithIcon iconLeading={ArrowUp} color="success">12%</BadgeWithIcon>
```

### Avatar — `@/components/base/avatar/avatar` (+ `avatar-label-group`)
Props: `size` (`xs|sm|md|lg|xl|2xl` — note `xxs` removed in v8), `src`, `alt`, `initials`, `icon`, `status` (`online|offline`), `verified`, `badge`.
```typescript
<Avatar src="/avatar.jpg" alt="User Name" size="md" />
<Avatar initials="OR" size="lg" />
<AvatarLabelGroup src="/avatar.jpg" title="Olivia Rhye" subtitle="olivia@untitledui.com" size="md" />
```

### FeaturedIcon — `@/components/foundations/featured-icon/featured-icon`
Props: `icon` (FC, required), `size` (`sm|md|lg|xl`), `color` (`brand|gray|error|warning|success`), `theme` (`light|gradient|dark|modern|modern-neue|outline`). Note: `modern`/`modern-neue` are gray-only.
```typescript
<FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
<FeaturedIcon icon={Settings} color="gray" theme="modern" size="lg" />
```

### Link — use Button with `href`
No dedicated Link component. Use `Button` with link colors `link-gray`, `link-color`, `link-destructive`.
```typescript
<Button href="/dashboard" color="link-color">View Dashboard</Button>
<Button href="https://example.com" color="link-color" iconTrailing={ExternalLink01}>Visit Site</Button>
```

# Forms
Components: `Input`, `Select`, `Checkbox`, `Radio`, `Textarea`, `Form` (wrapper with validation).

# Animation
- `motion` (Framer Motion) for complex animation; `tailwindcss-animate` for utilities; CSS transitions for simple state changes.
- `isLoading` prop drives built-in spinners/disabled states.
