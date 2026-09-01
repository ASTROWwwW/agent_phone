import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const uiDirectory = fileURLToPath(new URL('.', import.meta.url))
const rootIndexPath = join(uiDirectory, 'index.ts')

interface ComponentExport {
  exportedName: string
  moduleSpecifier: string
}

const konstaIosParity = {
  Actions: 'AgentActionSheet',
  ActionsButton: 'AgentActionButton',
  ActionsGroup: 'AgentActionGroup',
  ActionsLabel: 'AgentActionsLabel',
  App: 'AgentApp',
  Badge: 'AgentBadge',
  Block: 'AgentBlock',
  BlockFooter: 'AgentBlockFooter',
  BlockHeader: 'AgentBlockHeader',
  BlockTitle: 'AgentBlockTitle',
  Breadcrumbs: 'AgentBreadcrumbs',
  BreadcrumbsCollapsed: 'AgentBreadcrumbsCollapsed',
  BreadcrumbsItem: 'AgentBreadcrumbsItem',
  BreadcrumbsSeparator: 'AgentBreadcrumbsSeparator',
  Button: 'AgentButton',
  Card: 'AgentCard',
  Checkbox: 'AgentCheckbox',
  Chip: 'AgentChip',
  Dialog: 'AgentDialog',
  DialogButton: 'AgentDialogButton',
  Fab: 'AgentFab',
  Glass: 'AgentGlass',
  Icon: 'AgentIcon',
  Link: 'AgentLink',
  List: 'AgentList',
  ListButton: 'AgentListButton',
  ListGroup: 'AgentListGroup',
  ListGroupInner: 'AgentListGroupInner',
  ListInput: 'AgentField',
  ListItem: 'AgentListItem',
  MenuList: 'AgentMenuList',
  MenuListItem: 'AgentMenuListItem',
  Message: 'AgentMessage',
  Messagebar: 'AgentMessagebar',
  Messages: 'AgentMessages',
  MessagesTitle: 'AgentMessagesTitle',
  Navbar: 'AgentNavbar',
  NavbarBackLink: 'AgentNavbarBackLink',
  Notification: 'AgentNotification',
  Page: 'AgentAppPage',
  Panel: 'AgentPanel',
  Popover: 'AgentPopover',
  Popup: 'AgentPopup',
  Preloader: 'AgentSpinner',
  Progressbar: 'AgentProgress',
  Radio: 'AgentRadio',
  Range: 'AgentRange',
  Searchbar: 'AgentSearchbar',
  Segmented: 'AgentSegmented',
  SegmentedButton: 'AgentSegmentedButton',
  Sheet: 'AgentSheet',
  Stepper: 'AgentStepper',
  Tabbar: 'AgentTabBar',
  TabbarLink: 'AgentTabButton',
  Table: 'AgentTable',
  TableBody: 'AgentTableBody',
  TableCell: 'AgentTableCell',
  TableHead: 'AgentTableHead',
  TableRow: 'AgentTableRow',
  Toast: 'AgentToast',
  Toggle: 'AgentToggle',
  Toolbar: 'AgentToolbar',
  ToolbarPane: 'AgentToolbarPane',
} as const

function displayPath(path: string): string {
  const displayed = relative(uiDirectory, path).replace(/\\/g, '/')
  return displayed || '.'
}

function componentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && /^Agent[A-Za-z0-9_]*\.vue$/.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort()
}

function componentDirectories(): string[] {
  const familyDirectories = readdirSync(uiDirectory, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(uiDirectory, entry.name))
    .filter((directory) => componentFiles(directory).length > 0)
    .sort()

  return [uiDirectory, ...familyDirectories]
}

function componentExports(indexSource: string): ComponentExport[] {
  return Array.from(
    indexSource.matchAll(
      /export\s*{\s*default\s+as\s+(Agent[A-Za-z0-9_]*)\s*}\s*from\s*['"]([^'"]+\.vue)['"]/g,
    ),
    ([, exportedName, moduleSpecifier]) => ({
      exportedName,
      moduleSpecifier,
    }),
  )
}

describe('Agent UI public catalog', () => {
  it('covers every Konsta 5.3 Vue primitive with a Agent equivalent', () => {
    const componentNames = new Set(
      componentDirectories().flatMap((directory) =>
        componentFiles(directory).map((file) => basename(file, '.vue')),
      ),
    )
    const missingComponents = Object.entries(konstaIosParity)
      .filter(([, agentComponent]) => !componentNames.has(agentComponent))
      .map(
        ([konstaComponent, agentComponent]) =>
          `${konstaComponent} -> ${agentComponent}`,
      )

    expect(Object.keys(konstaIosParity)).toHaveLength(63)
    expect(missingComponents).toEqual([])
  })

  it('gives every component family its own export index', () => {
    const missingIndexes = componentDirectories()
      .map((directory) => join(directory, 'index.ts'))
      .filter((indexPath) => !existsSync(indexPath))
      .map(displayPath)

    expect(missingIndexes).toEqual([])
  })

  it('keeps AgentProvider as a Agent extension outside the Konsta catalog', () => {
    expect(readFileSync(rootIndexPath, 'utf8')).toContain(
      "export { default as AgentProvider } from './AgentProvider.vue'",
    )
  })

  it('exports every Agent component from its family index exactly once', () => {
    const failures: string[] = []

    for (const directory of componentDirectories()) {
      const indexPath = join(directory, 'index.ts')
      if (!existsSync(indexPath)) continue

      const expectedFiles = componentFiles(directory)
      const exports = componentExports(readFileSync(indexPath, 'utf8'))
      const exportedFiles = exports
        .map(({ moduleSpecifier }) => moduleSpecifier.replace(/^\.\//, ''))
        .sort()

      if (JSON.stringify(exportedFiles) !== JSON.stringify(expectedFiles)) {
        failures.push(
          `${displayPath(indexPath)} exports ${exportedFiles.join(', ') || '<none>'}; expected ${expectedFiles.join(', ') || '<none>'}`,
        )
      }

      for (const componentExport of exports) {
        const componentName = basename(componentExport.moduleSpecifier, '.vue')

        if (componentExport.exportedName !== componentName) {
          failures.push(
            `${displayPath(indexPath)} exports ${componentExport.moduleSpecifier} as ${componentExport.exportedName}; expected ${componentName}`,
          )
        }
      }
    }

    expect(failures).toEqual([])
  })

  it('re-exports every component family from the root index exactly once', () => {
    const rootIndexSource = readFileSync(rootIndexPath, 'utf8')
    const familyExports = Array.from(
      rootIndexSource.matchAll(/export\s+\*\s+from\s*['"]([^'"]+)['"]/g),
      ([, moduleSpecifier]) => moduleSpecifier.replace(/\/index$/, ''),
    )
    const failures = componentDirectories()
      .slice(1)
      .map((directory) => `./${displayPath(directory)}`)
      .filter(
        (familySpecifier) =>
          familyExports.filter((value) => value === familySpecifier).length !==
          1,
      )

    expect(failures).toEqual([])
  })

  it('keeps component names unique across public families', () => {
    const componentNames = componentDirectories().flatMap((directory) =>
      componentFiles(directory).map((file) => basename(file, '.vue')),
    )
    const duplicateNames = componentNames.filter(
      (name, index) => componentNames.indexOf(name) !== index,
    )

    expect(duplicateNames).toEqual([])
  })
})
