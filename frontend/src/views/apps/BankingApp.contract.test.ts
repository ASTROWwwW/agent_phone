import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { resourceUrl } from '../../testing/resource'

const source = readFileSync(
  new URL('./BankingApp.vue', import.meta.url),
  'utf8',
)
const styles = readFileSync(
  new URL('../../assets/main.css', import.meta.url),
  'utf8',
)
const appSource = readFileSync(
  new URL('../../App.vue', import.meta.url),
  'utf8',
)
const clientSource = readFileSync(
  resourceUrl('source/client/nui_events.lua'),
  'utf8',
)
const serverSource = readFileSync(
  resourceUrl('source/server/banking.lua'),
  'utf8',
)

describe('Banking app Agent UI migration', () => {
  it('uses Agent UI instead of Konsta components', () => {
    expect(source).not.toContain("from 'konsta/vue'")
    expect(source).not.toMatch(/<\/?k-/)

    for (const component of [
      'AgentAppPage',
      'AgentNavbar',
      'AgentGlass',
      'AgentCard',
      'AgentList',
      'AgentListItem',
      'AgentField',
      'AgentTabBar',
      'AgentTabButton',
      'AgentSheet',
      'AgentButton',
      'AgentSpinner',
      'AgentEmptyState',
      'AgentNotification',
    ]) {
      expect(source).toContain(`<${component}`)
    }
  })

  it('delegates sheet focus and escape handling to AgentSheet', () => {
    expect(source).toContain('@escape="closeAction"')
    expect(source).not.toContain('handleSheetKeydown')
    expect(source).not.toContain('handleWindowKeydown')
  })

  it('uses a comma-first text amount field without native stepper arrows', () => {
    expect(source).toContain('class="banking-amount-field"')
    expect(source).toContain('inputmode="decimal"')
    expect(source).toContain('type="text"')
    expect(source).not.toMatch(
      /input-id="banking-transfer-amount"[\s\S]*?type="number"/,
    )
    expect(source).toContain('normalizeBankingAmountInput')
    expect(source).toContain('parseBankingAmount')
  })

  it('turns received phone transfers into routed Banking notifications', () => {
    expect(serverSource).toContain('kind = "transfer_in"')
    expect(serverSource).toContain('currency = Config.Banking.Currency')
    expect(clientSource).toContain(
      '["agent_phone:banking:changed"] = "banking:changed"',
    )
    expect(clientSource).toContain(
      'SendNUIMessage({ type = nui_type, data = data })',
    )
    expect(appSource).toContain("data?.kind === 'transfer_in'")
    expect(appSource).toContain("appId: 'banking'")
    expect(appSource).toContain("route: '/apps/banking'")
    expect(appSource).toContain("phone.t('Apps.banking.notifications.received'")
  })

  it('resets tab scroll and locks the background behind sheets', () => {
    expect(source).toContain('async function selectTab(nextTab: BankingTab)')
    expect(source).toContain('bankingScroll.value.scrollTop = 0')
    expect(source).toContain(':class="{ \'is-locked\': overlayOpened }"')
    expect(source).toContain('@click="selectTab(\'activity\')"')
    expect(source).toContain('@click="selectTab(\'home\')"')
    expect(styles).toMatch(
      /\.banking-scroll\s*\{[^}]*overscroll-behavior-y:\s*contain;[^}]*touch-action:\s*pan-y;/s,
    )
    expect(styles).toMatch(
      /\.banking-scroll\.is-locked\s*\{[^}]*overflow-y:\s*hidden;[^}]*touch-action:\s*none;/s,
    )
  })

  it('opens every transaction in an accessible Agent detail sheet', () => {
    expect(source).toContain(
      'const selectedTransaction = ref<BankingTransaction | null>(null)',
    )
    expect(source).toContain(
      'function openTransaction(transaction: BankingTransaction)',
    )
    expect(source).toContain('@click="openTransaction(transaction)"')
    expect(source).toContain('link-component="button"')
    expect(source).toContain(':opened="overlayOpened"')
    expect(source).toContain('swipe-to-close')
    expect(source).toContain('grabber-clickable')
    expect(source).toContain('@swipeclose="closeAction"')
    expect(source).not.toContain('banking-modal__close')
    expect(source).toContain('id="banking-transaction-detail-title"')
    expect(source).toContain('banking-transaction-detail__amount')
    expect(source).toContain("phone.t('Apps.banking.transactionReference')")
  })
})
