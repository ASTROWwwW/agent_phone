import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./BillingApp.vue', import.meta.url),
  'utf8',
)

describe('Billing app Agent UI migration', () => {
  it('uses Agent UI instead of Konsta components', () => {
    expect(source).not.toContain("from 'konsta/vue'")
    expect(source).not.toMatch(/<\/?k[A-Z-]/)
    expect(source).not.toContain('--k-')

    for (const component of [
      'AgentAppPage',
      'AgentNavbar',
      'AgentNavbarBackLink',
      'AgentGlass',
      'AgentCard',
      'AgentBadge',
      'AgentButton',
      'AgentLink',
      'AgentSearchbar',
      'AgentSegmented',
      'AgentSegmentedButton',
      'AgentSpinner',
      'AgentTabBar',
      'AgentTabButton',
      'AgentSheet',
      'AgentNotification',
    ]) {
      expect(source).toContain(`<${component}`)
    }
  })

  it('uses the Agent sheet focus and escape behavior for payment', () => {
    expect(source).toContain('@escape="paymentOpen = false"')
    expect(source).toContain(':ariaLabelledby=')
  })

  it('shows the Billing icon and localized name as one navbar brand', () => {
    expect(source).toContain('<span class="billing-navbar__brand">')
    expect(source).toContain('<ReceiptText :size="22" :stroke-width="2" />')
    expect(source).toContain("<strong>{{ t('name') }}</strong>")
  })

  it('lets the navbar float over the page gradient without a fade strip', () => {
    expect(source).toMatch(
      /\.billing-navbar\s*\{[^}]*--agent-navbar-glass:\s*transparent;/s,
    )
    expect(source).not.toContain('.billing-navbar::after')
  })

  it('lets the page gradient show through the Agent page backdrop', () => {
    expect(source).toMatch(
      /\.agent-app-page__backdrop\)\s*\{\s*background:\s*transparent;/s,
    )
    expect(source).toMatch(/\.billing-app\s*\{[^}]*isolation:\s*isolate;/s)
  })

  it('carries the three overview figures on one statement card', () => {
    expect(source).toContain('class="billing-statement"')
    expect(source).toContain("t('summary.due')")
    expect(source).toContain("t('summary.open')")
    expect(source).toContain("t('summary.overdue')")
    expect(source).not.toContain('billing-summary__item')
    expect(source).toContain("'is-clear': billing.overview.overdueCount === 0")
    expect(source).toMatch(
      /\.billing-statement__figure--overdue\.is-clear[\s\S]{0,220}?color:/s,
    )
  })

  it('keeps filter selectors quieter than the page accent', () => {
    expect(source).toMatch(
      /\.billing-direction,\s*\n\.billing-filters\s*\{\s*--agent-app-accent:/s,
    )
    expect(source).toMatch(
      /\.billing-app--light \.billing-direction,[\s\S]{0,90}?--agent-app-accent:/s,
    )
  })

  it('aligns invoice information and note with the detail hero edges', () => {
    expect(source).toMatch(
      /\.billing-panel,\s*\.billing-note\s*\{[^}]*margin-right:\s*0;[^}]*margin-left:\s*0;/s,
    )
  })

  it('presents pay and dispute as a matched action pair', () => {
    expect(source).toContain('class="billing-action billing-action--pay"')
    expect(source).toContain('class="billing-action billing-action--dispute"')
    expect(source).toContain('variant="secondary"')
    expect(source).toMatch(
      /\.billing-detail__actions\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s,
    )
    expect(source).toMatch(
      /\.billing-detail__actions :deep\(\.agent-button\)\s*\{[^}]*height:\s*44px;[^}]*border-radius:\s*14px;/s,
    )
    expect(source).toMatch(
      /@media \(hover: hover\)\s*\{[^}]*\.billing-detail__actions :deep\(\.billing-action:hover\)\s*\{[^}]*transform:\s*translateY\(-2px\);/s,
    )
    expect(source).toContain(
      ':deep(.billing-action:hover .billing-action-chevron)',
    )
  })

  it('keeps the invoice and payment information heading readable', () => {
    expect(source).toMatch(
      /\.billing-detail__section-title\s*\{[^}]*font-size:\s*11px;/s,
    )
  })

  it('keeps the Overview brand in main and detail headers', () => {
    expect(source).toContain('<template #title>')
    expect(source).toContain('<template v-if="screen === \'detail\'" #left>')
    expect(source).not.toContain(':subtitle=')
    expect(source).not.toContain("t('detail.title')")
  })

  it('identifies Inbox and History with content headings', () => {
    expect(source).toContain('<header class="billing-view-heading">')
    expect(source).toContain('<Inbox v-if="tab === \'inbox\'" :size="20" />')
    expect(source).toContain('<History v-else :size="20" />')
    expect(source).toContain('<h1>{{ t(`tabs.${tab}`) }}</h1>')
    expect(source).toMatch(
      /\.billing-view-heading h1\s*\{[^}]*font-size:\s*23px;/s,
    )
  })

  it('keeps overview invoice cards vertically compact', () => {
    expect(source).toMatch(
      /\.billing-invoice-card\s*\{[^}]*min-height:\s*88px;[^}]*padding:\s*11px 13px;/s,
    )
    expect(source).toMatch(
      /\.billing-invoice-card__amount\s*\{[^}]*grid-template-columns:\s*auto 17px;[^}]*row-gap:\s*5px;/s,
    )
    expect(source).toMatch(
      /\.billing-invoice-card__amount \.billing-status\s*\{[^}]*grid-column:\s*1 \/ -1;/s,
    )
  })
})
