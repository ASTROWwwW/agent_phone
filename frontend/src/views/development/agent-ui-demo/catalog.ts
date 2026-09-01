export const AGENT_UI_DEMO_CATALOG = [
  { id: 'action-sheet', title: 'Action Sheet' },
  { id: 'badge', title: 'Badge' },
  { id: 'breadcrumbs', title: 'Breadcrumbs' },
  { id: 'buttons', title: 'Buttons' },
  { id: 'cards', title: 'Cards' },
  { id: 'checkbox', title: 'Checkbox' },
  { id: 'chips', title: 'Chips' },
  { id: 'contacts-list', title: 'Contacts List' },
  { id: 'content-block', title: 'Content Block' },
  { id: 'data-table', title: 'Data Table' },
  { id: 'dialog', title: 'Dialog' },
  { id: 'fab', title: 'FAB (Floating Action Button)' },
  { id: 'form-inputs', title: 'Form Inputs' },
  { id: 'list', title: 'List' },
  { id: 'list-button', title: 'List Button' },
  { id: 'menu-list', title: 'Menu List' },
  { id: 'messages', title: 'Messages' },
  { id: 'navbar', title: 'Navbar' },
  { id: 'notification', title: 'Notification' },
  { id: 'side-panels', title: 'Panel / Side Panels' },
  { id: 'popover', title: 'Popover' },
  { id: 'popup', title: 'Popup' },
  { id: 'preloader', title: 'Preloader' },
  { id: 'progressbar', title: 'Progressbar' },
  { id: 'radio', title: 'Radio' },
  { id: 'range-slider', title: 'Range Slider' },
  { id: 'searchbar', title: 'Searchbar' },
  { id: 'segmented-control', title: 'Segmented Control' },
  { id: 'sheet-modal', title: 'Sheet Modal' },
  { id: 'stepper', title: 'Stepper' },
  { id: 'subnavbar', title: 'Subnavbar' },
  { id: 'tabbar', title: 'Tabbar' },
  { id: 'toast', title: 'Toast' },
  { id: 'toggle', title: 'Toggle' },
  { id: 'toolbar', title: 'Toolbar' },
] as const

export const AGENT_UI_EXTENSION_CATALOG = [
  { id: 'agent-extensions', title: 'Agent Extensions' },
] as const

export type AgentUiDemoId =
  | (typeof AGENT_UI_DEMO_CATALOG)[number]['id']
  | (typeof AGENT_UI_EXTENSION_CATALOG)[number]['id']

const demoIds = new Set<string>(
  [...AGENT_UI_DEMO_CATALOG, ...AGENT_UI_EXTENSION_CATALOG].map(({ id }) => id),
)

export function isAgentUiDemoId(value: unknown): value is AgentUiDemoId {
  return typeof value === 'string' && demoIds.has(value)
}
