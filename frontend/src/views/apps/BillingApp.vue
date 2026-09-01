<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeftRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Hash,
  History,
  House,
  Inbox,
  ListFilter,
  ReceiptText,
  RefreshCw,
  SearchX,
  ShieldAlert,
  Send,
  WalletCards,
  X,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { useBillingStore } from '@/stores/billing'
import { usePhoneStore } from '@/stores/phone'
import type {
  BillingDirection,
  BillingFilter,
  BillingStatus,
  InvoiceSummary,
} from '@/types/billing'
import {
  AgentAppPage,
  AgentBadge,
  AgentButton,
  AgentCard,
  AgentGlass,
  AgentLink,
  AgentNavbar,
  AgentNavbarBackLink,
  AgentSearchbar,
  AgentSegmented,
  AgentSegmentedButton,
  AgentSheet,
  AgentSpinner,
  AgentTabBar,
  AgentTabButton,
  AgentNotification,
} from '@/ui'
import { isTrustedRootMessageSource } from '@/utils/windowMessages'

type BillingTab = 'overview' | 'inbox' | 'history'
type BillingScreen = 'main' | 'detail'

const phone = usePhoneStore()
const billing = useBillingStore()
const tab = ref<BillingTab>('overview')
const screen = ref<BillingScreen>('main')
const direction = ref<BillingDirection>('inbox')
const filter = ref<BillingFilter>('all')
const filters: BillingFilter[] = ['all', 'open', 'paid']
const search = ref('')
const paymentOpen = ref(false)
const toastOpen = ref(false)
const toastText = ref('')
let searchTimer: number | undefined
let toastTimer: number | undefined

const t = (key: string, values?: Record<string, string | number>) =>
  phone.t(
    `Apps.billing.${key}`,
    values &&
      Object.fromEntries(
        Object.entries(values).map(([name, value]) => [name, String(value)]),
      ),
  )

const visibleInvoices = computed(() => {
  if (tab.value !== 'history') return billing.invoices
  return billing.invoices.filter((invoice) =>
    ['paid', 'cancelled', 'refunded', 'disputed'].includes(invoice.status),
  )
})

const statusIcons: Record<BillingStatus, typeof Clock3> = {
  open: Clock3,
  processing: RefreshCw,
  paid: CheckCircle2,
  disputed: ShieldAlert,
  cancelled: X,
  refunded: ArrowLeftRight,
}

const filterIcons: Record<BillingFilter, typeof Clock3> = {
  all: ListFilter,
  open: Clock3,
  overdue: AlertTriangle,
  paid: CheckCircle2,
}

function formatMoney(
  amount: number,
  currency = billing.overview?.currency ?? '$',
): string {
  return `${new Intl.NumberFormat(phone.lang, { maximumFractionDigits: 0 }).format(amount)} ${currency}`
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return t('detail.noDueDate')
  return new Intl.DateTimeFormat(phone.lang, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(timestamp)
}

function formatDateTime(timestamp: number | null): string {
  if (!timestamp) return t('detail.noDueDate')
  return new Intl.DateTimeFormat(phone.lang, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

function statusKey(invoice: InvoiceSummary): string {
  return invoice.isOverdue ? 'overdue' : invoice.status
}

function showToast(message: string): void {
  toastText.value = message
  toastOpen.value = true
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toastOpen.value = false), 2800)
}

async function loadList(): Promise<boolean> {
  const activeFilter = tab.value === 'history' ? 'paid' : filter.value
  return billing.loadInvoices(direction.value, activeFilter, search.value)
}

async function selectTab(nextTab: BillingTab): Promise<void> {
  tab.value = nextTab
  screen.value = 'main'
  paymentOpen.value = false
  if (nextTab === 'overview') {
    await billing.loadOverview(direction.value)
    return
  }
  direction.value = 'inbox'
  filter.value = nextTab === 'history' ? 'paid' : 'all'
  await loadList()
}

async function selectDirection(nextDirection: BillingDirection): Promise<void> {
  direction.value = nextDirection
  if (tab.value === 'overview') await billing.loadOverview(nextDirection)
  else await loadList()
}

async function selectFilter(nextFilter: BillingFilter): Promise<void> {
  filter.value = nextFilter
  await loadList()
}

function updateSearch(event: Event): void {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) {
    console.error('[billing] Search input emitted without an input target.')
    return
  }
  search.value = input.value
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => void loadList(), 220)
}

function clearSearch(): void {
  search.value = ''
  void loadList()
}

async function openInvoice(invoice: InvoiceSummary): Promise<void> {
  screen.value = 'detail'
  if (!(await billing.loadDetail(invoice.id))) screen.value = 'main'
}

function goBack(): void {
  paymentOpen.value = false
  billing.detail = null
  screen.value = 'main'
}

async function payInvoice(): Promise<void> {
  if (!billing.detail) return
  const response = await billing.pay(billing.detail.id)
  if (!response.success) {
    showToast(t(`errors.${response.error ?? 'payment_failed'}`))
    return
  }
  paymentOpen.value = false
  showToast(t('payment.success'))
}

async function disputeInvoice(): Promise<void> {
  if (!billing.detail) return
  const response = await billing.dispute(billing.detail.id)
  if (!response.success) {
    showToast(t(`errors.${response.error ?? 'dispute_unavailable'}`))
    return
  }
  showToast(t('detail.disputedSuccess'))
}

function onBillingMessage(event: MessageEvent): void {
  if (!isTrustedRootMessageSource(event.source, window)) return
  if (
    event.data?.type !== 'billing:changed' &&
    event.data?.type !== 'billing:new'
  ) {
    return
  }

  if (tab.value !== 'overview') void loadList()
  if (screen.value === 'detail' && billing.detail) {
    void billing.loadDetail(billing.detail.id)
  }
}

onMounted(async () => {
  window.addEventListener('message', onBillingMessage)
  await billing.loadOverview(direction.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onBillingMessage)
  if (searchTimer) window.clearTimeout(searchTimer)
  if (toastTimer) window.clearTimeout(toastTimer)
})
</script>

<template>
  <AgentAppPage
    class="billing-app native-app"
    :label="t('name')"
    :dark="phone.isDarkMode"
    :accent="phone.isDarkMode ? '#bcdc74' : '#41601f'"
    :accent-soft="
      phone.isDarkMode ? 'rgba(188, 220, 116, 0.12)' : 'rgba(65, 96, 31, 0.10)'
    "
    :class="{
      'billing-app--light': !phone.isDarkMode,
    }"
  >
    <AgentNavbar class="billing-navbar" :title="t('name')">
      <template v-if="screen === 'detail'" #left>
        <AgentNavbarBackLink :ariaLabel="t('back')" @click="goBack" />
      </template>
      <template #title>
        <span class="billing-navbar__brand">
          <ReceiptText :size="22" :stroke-width="2" />
          <strong>{{ t('name') }}</strong>
        </span>
      </template>
    </AgentNavbar>

    <section v-if="screen === 'detail'" class="billing-scroll billing-detail">
      <div v-if="billing.isLoading && !billing.detail" class="billing-loading">
        <AgentSpinner :label="phone.t('Common.loading')" />
        <span>{{ phone.t('Common.loading') }}</span>
      </div>
      <template v-else-if="billing.detail">
        <AgentGlass
          :highlight="false"
          class="billing-detail__hero"
          :class="{
            'billing-detail__hero--paid': billing.detail.status === 'paid',
          }"
        >
          <template v-if="billing.detail.status === 'paid'">
            <div class="billing-paid-mark">
              <CheckCircle2 :size="38" :stroke-width="2.2" />
            </div>
            <strong class="billing-paid-title">{{ t('status.paid') }}</strong>
            <strong class="billing-paid-amount">
              {{ formatMoney(billing.detail.amount, billing.detail.currency) }}
            </strong>
            <span class="billing-paid-date">
              {{
                t('detail.paidOn', {
                  date: formatDateTime(billing.detail.paidAt),
                })
              }}
            </span>
          </template>
          <template v-else>
            <div class="billing-issuer-mark"><Building2 :size="26" /></div>
            <div class="billing-detail__identity">
              <strong>{{ billing.detail.issuerLabel }}</strong>
              <span>#{{ billing.detail.id.slice(0, 13).toUpperCase() }}</span>
            </div>
            <AgentBadge
              :class="`billing-status billing-status--${statusKey(billing.detail)}`"
            >
              {{ t(`status.${statusKey(billing.detail)}`) }}
            </AgentBadge>
            <div class="billing-detail__amount">
              <span>{{ t('detail.total') }}</span>
              <strong>{{
                formatMoney(billing.detail.amount, billing.detail.currency)
              }}</strong>
            </div>
          </template>
        </AgentGlass>

        <div v-if="billing.detail.canPay" class="billing-detail__actions">
          <AgentButton
            class="billing-action billing-action--pay"
            @click="paymentOpen = true"
          >
            <WalletCards :size="15" />
            {{ t('payment.payNow') }}
            <ChevronRight class="billing-action-chevron" :size="15" />
          </AgentButton>
          <AgentButton
            v-if="billing.detail.canDispute"
            class="billing-action billing-action--dispute"
            variant="secondary"
            @click="disputeInvoice"
          >
            <ShieldAlert :size="15" />
            {{ t('detail.dispute') }}
            <ChevronRight class="billing-action-chevron" :size="15" />
          </AgentButton>
        </div>

        <div class="billing-detail__section-title">
          {{
            t(
              billing.detail.status === 'paid'
                ? 'detail.paymentInformation'
                : 'detail.invoiceInformation',
            )
          }}
        </div>

        <AgentCard :content-wrap="false" class="billing-panel">
          <div
            v-if="billing.detail.status === 'paid'"
            class="billing-detail-row"
          >
            <span class="billing-detail-row__icon"
              ><Building2 :size="18"
            /></span>
            <span class="billing-detail-row__copy">
              <small>{{ t('detail.issuer') }}</small>
              <strong>{{ billing.detail.issuerLabel }}</strong>
            </span>
          </div>
          <div v-else class="billing-detail-row">
            <span class="billing-detail-row__icon"
              ><ReceiptText :size="18"
            /></span>
            <span class="billing-detail-row__copy">
              <small>{{ t('detail.reason') }}</small>
              <strong>{{ billing.detail.title }}</strong>
            </span>
          </div>
          <div class="billing-detail-row">
            <span class="billing-detail-row__icon">
              <FileCheck2 v-if="billing.detail.status === 'paid'" :size="18" />
              <CalendarDays v-else :size="18" />
            </span>
            <span class="billing-detail-row__copy">
              <small>{{
                t(
                  billing.detail.status === 'paid'
                    ? 'detail.paidAt'
                    : 'detail.issued',
                )
              }}</small>
              <strong>{{
                billing.detail.status === 'paid'
                  ? formatDateTime(billing.detail.paidAt)
                  : formatDate(billing.detail.issuedAt)
              }}</strong>
            </span>
          </div>
          <div
            v-if="billing.detail.status !== 'paid'"
            class="billing-detail-row"
          >
            <span class="billing-detail-row__icon"><Clock3 :size="18" /></span>
            <span class="billing-detail-row__copy">
              <small>{{ t('detail.due') }}</small>
              <strong>{{ formatDate(billing.detail.dueAt) }}</strong>
            </span>
          </div>
          <div
            v-if="billing.detail.paymentReference"
            class="billing-detail-row"
          >
            <span class="billing-detail-row__icon"><Hash :size="18" /></span>
            <span class="billing-detail-row__copy">
              <small>{{ t('detail.paymentReference') }}</small>
              <strong class="billing-detail-row__reference">
                {{ billing.detail.paymentReference }}
              </strong>
            </span>
          </div>
          <div class="billing-detail-row">
            <span class="billing-detail-row__icon"><Hash :size="18" /></span>
            <span class="billing-detail-row__copy">
              <small>{{ t('detail.invoiceNumber') }}</small>
              <strong>#{{ billing.detail.id.toUpperCase() }}</strong>
            </span>
          </div>
        </AgentCard>

        <AgentCard v-if="billing.detail.description" class="billing-note">
          <span>{{ t('detail.note') }}</span>
          <p>{{ billing.detail.description }}</p>
        </AgentCard>

      </template>
    </section>

    <section v-else class="billing-scroll billing-main">
      <div
        v-if="billing.isLoading && !billing.overview"
        class="billing-loading"
      >
        <AgentSpinner :label="phone.t('Common.loading')" />
        <span>{{ phone.t('Common.loading') }}</span>
      </div>

      <div v-else-if="billing.error && !billing.overview" class="billing-empty">
        <AlertTriangle :size="39" />
        <strong>{{ t(`errors.${billing.error}`) }}</strong>
        <AgentButton rounded @click="billing.loadOverview(direction)">
          {{ t('tryAgain') }}
        </AgentButton>
      </div>

      <template v-else-if="tab === 'overview' && billing.overview">
        <article class="billing-statement">
          <header class="billing-statement__top">
            <div>
              <span class="billing-statement__label">{{
                t('summary.due')
              }}</span>
              <strong class="billing-statement__amount">{{
                formatMoney(billing.overview.openTotal)
              }}</strong>
            </div>
            <span class="billing-statement__mark" aria-hidden="true">
              <ReceiptText :size="20" />
            </span>
          </header>
          <footer class="billing-statement__bottom">
            <div class="billing-statement__figure">
              <span class="billing-statement__label">{{
                t('summary.open')
              }}</span>
              <strong>{{ billing.overview.openCount }}</strong>
            </div>
            <div
              class="billing-statement__figure billing-statement__figure--overdue"
              :class="{ 'is-clear': billing.overview.overdueCount === 0 }"
            >
              <span class="billing-statement__label">
                <AlertTriangle :size="11" />
                {{ t('summary.overdue') }}
              </span>
              <strong>{{ billing.overview.overdueCount }}</strong>
            </div>
          </footer>
        </article>

        <div
          v-if="billing.overview.supportsSent"
          class="billing-filter-panel billing-filter-panel--overview"
        >
          <span class="billing-filter-label">{{ t('filters.scope') }}</span>
          <AgentSegmented class="billing-direction">
            <AgentSegmentedButton
              type="button"
              :active="direction === 'inbox'"
              @click="selectDirection('inbox')"
            >
              <Inbox :size="15" />
              <span>{{ t('direction.inbox') }}</span>
              <b
                v-if="billing.overview.unreadCount"
                class="billing-filter-count"
              >
                {{ Math.min(99, billing.overview.unreadCount) }}
              </b>
            </AgentSegmentedButton>
            <AgentSegmentedButton
              type="button"
              :active="direction === 'sent'"
              @click="selectDirection('sent')"
            >
              <Send :size="15" />
              <span>{{ t('direction.sent') }}</span>
            </AgentSegmentedButton>
          </AgentSegmented>
        </div>

        <div class="billing-section-heading">
          <div>
            <span>{{ t('overview.eyebrow') }}</span>
            <h2>{{ t('overview.urgent') }}</h2>
          </div>
          <AgentLink component="button" type="button" @click="selectTab('inbox')">
            {{ t('overview.viewAll') }}
          </AgentLink>
        </div>

        <div
          v-if="billing.overview.urgentInvoices.length"
          class="billing-card-list"
        >
          <button
            v-for="invoice in billing.overview.urgentInvoices"
            :key="invoice.id"
            type="button"
            class="billing-invoice-card"
            @click="openInvoice(invoice)"
          >
            <span class="billing-issuer-mark"><Building2 :size="22" /></span>
            <span class="billing-invoice-card__copy">
              <strong>{{ invoice.title }}</strong>
              <small>{{ invoice.issuerLabel }}</small>
              <small
                >{{ t('detail.due') }} {{ formatDate(invoice.dueAt) }}</small
              >
            </span>
            <span class="billing-invoice-card__amount">
              <AgentBadge
                :class="`billing-status billing-status--${statusKey(invoice)}`"
              >
                {{ t(`status.${statusKey(invoice)}`) }}
              </AgentBadge>
              <strong>{{
                formatMoney(invoice.amount, invoice.currency)
              }}</strong>
              <ChevronRight :size="17" />
            </span>
          </button>
        </div>
        <div v-else class="billing-empty">
          <CheckCircle2 :size="39" />
          <strong>{{ t('empty.openTitle') }}</strong>
          <p>{{ t('empty.openBody') }}</p>
        </div>
      </template>

      <template v-else>
        <header class="billing-view-heading">
          <span class="billing-view-heading__icon">
            <Inbox v-if="tab === 'inbox'" :size="20" />
            <History v-else :size="20" />
          </span>
          <div>
            <small>{{ t('name') }}</small>
            <h1>{{ t(`tabs.${tab}`) }}</h1>
          </div>
        </header>

        <div
          v-if="tab === 'inbox' && billing.overview?.supportsSent"
          class="billing-filter-panel"
        >
          <span class="billing-filter-label">{{ t('filters.scope') }}</span>
          <AgentSegmented class="billing-direction">
            <AgentSegmentedButton
              type="button"
              :active="direction === 'inbox'"
              @click="selectDirection('inbox')"
            >
              <Inbox :size="15" />
              <span>{{ t('direction.inbox') }}</span>
              <b
                v-if="billing.overview?.unreadCount"
                class="billing-filter-count"
              >
                {{ Math.min(99, billing.overview.unreadCount) }}
              </b>
            </AgentSegmentedButton>
            <AgentSegmentedButton
              type="button"
              :active="direction === 'sent'"
              @click="selectDirection('sent')"
            >
              <Send :size="15" />
              <span>{{ t('direction.sent') }}</span>
            </AgentSegmentedButton>
          </AgentSegmented>
        </div>
        <AgentSearchbar
          v-if="tab === 'inbox'"
          class="billing-search"
          :clear-label="phone.t('Common.clear')"
          :placeholder="t('search')"
          :value="search"
          @clear="clearSearch"
          @input="updateSearch"
        />
        <div v-if="tab === 'inbox'" class="billing-status-filter">
          <span class="billing-filter-label">{{ t('filters.status') }}</span>
          <div class="billing-status-filter__scroll">
            <AgentSegmented class="billing-filters">
              <AgentSegmentedButton
                v-for="entry in filters"
                :key="entry"
                type="button"
                :active="filter === entry"
                @click="selectFilter(entry)"
              >
                <component :is="filterIcons[entry]" :size="14" />
                <span>{{ t(`filters.${entry}`) }}</span>
              </AgentSegmentedButton>
            </AgentSegmented>
          </div>
        </div>

        <div
          v-if="billing.isLoading"
          class="billing-loading billing-loading--list"
        >
          <AgentSpinner :label="phone.t('Common.loading')" />
        </div>
        <div v-else-if="visibleInvoices.length" class="billing-list">
          <button
            v-for="invoice in visibleInvoices"
            :key="invoice.id"
            type="button"
            class="billing-list-row"
            :class="{ 'is-unread': invoice.isUnread }"
            @click="openInvoice(invoice)"
          >
            <span class="billing-list-row__icon">
              <component :is="statusIcons[invoice.status]" :size="20" />
            </span>
            <span class="billing-list-row__copy">
              <strong>{{ invoice.issuerLabel }}</strong>
              <span>{{ invoice.title }}</span>
              <small
                >#{{ invoice.id.slice(0, 8).toUpperCase() }} ·
                {{ formatDate(invoice.issuedAt) }}</small
              >
            </span>
            <span class="billing-list-row__meta">
              <AgentBadge
                :class="`billing-status billing-status--${statusKey(invoice)}`"
              >
                {{ t(`status.${statusKey(invoice)}`) }}
              </AgentBadge>
              <strong>{{
                formatMoney(invoice.amount, invoice.currency)
              }}</strong>
            </span>
          </button>
          <AgentButton
            v-if="billing.hasMore"
            clear
            :disabled="billing.isLoadingMore"
            class="billing-load-more"
            @click="
              billing.loadInvoices(
                direction,
                tab === 'history' ? 'paid' : filter,
                search,
                true,
              )
            "
          >
            <AgentSpinner
              v-if="billing.isLoadingMore"
              :label="phone.t('Common.loading')"
            />
            <span v-else>{{ t('loadMore') }}</span>
          </AgentButton>
        </div>
        <div v-else class="billing-empty billing-empty--list">
          <SearchX :size="39" />
          <strong>{{ t(`empty.${tab}Title`) }}</strong>
          <p>{{ t(`empty.${tab}Body`) }}</p>
        </div>
      </template>
    </section>

    <AgentTabBar
      v-if="screen === 'main'"
      icons
      labels
      class="billing-tabbar"
      :label="t('navigation')"
    >
      <AgentTabButton
        class="billing-tab-button"
        :active="tab === 'overview'"
        :label="t('tabs.overview')"
        @click="selectTab('overview')"
      >
        <template #icon>
          <House
            :size="20"
            :fill="tab === 'overview' ? 'currentColor' : 'none'"
          />
        </template>
      </AgentTabButton>
      <AgentTabButton
        class="billing-tab-button"
        :active="tab === 'inbox'"
        :label="t('tabs.inbox')"
        @click="selectTab('inbox')"
      >
        <template #icon>
          <span class="billing-tab-icon">
            <Inbox
              :size="20"
              :fill="tab === 'inbox' ? 'currentColor' : 'none'"
            />
            <b v-if="billing.overview?.unreadCount">{{
              Math.min(99, billing.overview.unreadCount)
            }}</b>
          </span>
        </template>
      </AgentTabButton>
      <AgentTabButton
        class="billing-tab-button"
        :active="tab === 'history'"
        :label="t('tabs.history')"
        @click="selectTab('history')"
      >
        <template #icon><History :size="20" /></template>
      </AgentTabButton>
    </AgentTabBar>

    <AgentSheet
      :opened="paymentOpen"
      class="billing-payment-sheet"
      :ariaLabelledby="billing.detail ? 'billing-payment-title' : undefined"
      @backdropclick="paymentOpen = false"
      @escape="paymentOpen = false"
    >
      <section v-if="billing.detail" class="billing-payment-sheet__content">
        <span class="billing-payment-sheet__icon"
          ><WalletCards :size="27"
        /></span>
        <h2 id="billing-payment-title">{{ t('payment.title') }}</h2>
        <p>{{ t('payment.body', { issuer: billing.detail.issuerLabel }) }}</p>
        <AgentGlass :highlight="false" class="billing-payment-total">
          <span>{{ billing.detail.title }}</span>
          <strong>{{
            formatMoney(billing.detail.amount, billing.detail.currency)
          }}</strong>
        </AgentGlass>
        <AgentButton
          block
          rounded
          large
          :disabled="billing.isPaying"
          @click="payInvoice"
        >
          <AgentSpinner
            v-if="billing.isPaying"
            :label="phone.t('Common.loading')"
          />
          <span v-else>{{ t('payment.confirm') }}</span>
        </AgentButton>
        <AgentLink component="button" type="button" @click="paymentOpen = false">
          {{ t('payment.cancel') }}
        </AgentLink>
      </section>
    </AgentSheet>

    <AgentNotification
      :opened="toastOpen"
      :text="toastText"
      class="billing-notification"
    />
  </AgentAppPage>
</template>

<style scoped>
.billing-app {
  --billing-blue: #1784ff;
  --billing-accent: #bcdc74;
  --billing-border: rgb(255 255 255 / 8%);
  --billing-surface: rgb(255 255 255 / 5%);
  --billing-surface-strong: rgb(255 255 255 / 9%);
  --billing-panel: rgb(19 22 21 / 88%);
  --billing-muted: rgb(233 240 234 / 58%);
  --billing-sub: rgb(233 240 234 / 36%);
  --billing-radius-lg: 18px;
  --billing-radius-md: 14px;
  --billing-gutter: 16px;
  position: relative;
  display: flex;
  height: 100%;
  overflow: hidden;
  flex-direction: column;
  color: #fff;
  background:
    radial-gradient(
      132% 74% at 50% -12%,
      rgb(150 226 128 / 22%),
      transparent 62%
    ),
    radial-gradient(78% 42% at 90% 4%, rgb(201 242 76 / 13%), transparent 56%),
    radial-gradient(96% 46% at 2% 98%, rgb(74 150 226 / 11%), transparent 62%),
    linear-gradient(180deg, #14201a 0%, #101815 26%, #0b0e0d 60%, #070808 100%);
  font-family: var(--agent-font-family);
  isolation: isolate;
}
.billing-app > :deep(.agent-app-page__backdrop) {
  background: transparent;
}
.billing-app::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: linear-gradient(180deg, rgb(255 255 255 / 6%), transparent 24%);
  content: '';
  pointer-events: none;
}
.billing-app--light {
  --billing-accent: #41601f;
  --billing-border: rgb(16 26 20 / 10%);
  --billing-surface: rgb(255 255 255 / 78%);
  --billing-surface-strong: rgb(255 255 255 / 93%);
  --billing-panel: rgb(255 255 255 / 90%);
  --billing-muted: #626b63;
  --billing-sub: #949c95;
  color: #121612;
  background:
    radial-gradient(
      120% 66% at 50% -12%,
      rgb(150 226 128 / 26%),
      transparent 62%
    ),
    radial-gradient(78% 44% at 92% 8%, rgb(201 242 76 / 18%), transparent 56%),
    radial-gradient(90% 42% at 2% 96%, rgb(74 150 226 / 9%), transparent 62%),
    linear-gradient(180deg, #f3f8ef 0%, #eff4ee 44%, #eaefea 100%);
}
.billing-app--light::before {
  background: linear-gradient(180deg, rgb(255 255 255 / 55%), transparent 26%);
}

.billing-navbar {
  --agent-navbar-glass: transparent;
  flex: 0 0 auto;
  color: inherit;
}
.billing-navbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: inherit;
}
.billing-navbar__brand svg {
  color: var(--billing-accent);
}
.billing-navbar__brand strong {
  font-size: 16px;
  font-weight: 650;
  letter-spacing: 0.6px;
}
.billing-scroll {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 4px var(--billing-gutter) 108px;
  overscroll-behavior-y: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.billing-scroll::-webkit-scrollbar {
  display: none;
}
.billing-scroll > * {
  flex: 0 0 auto;
}
.billing-scroll.billing-detail {
  padding-bottom: calc(var(--agent-safe-area-bottom, 0px) + 22px);
}
.billing-view-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 2px 2px 0;
}
.billing-view-heading__icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--billing-border);
  border-radius: 12px;
  background: var(--billing-surface-strong);
  color: var(--billing-accent);
}

.billing-view-heading small {
  display: block;
  color: var(--billing-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.billing-view-heading h1 {
  margin: 1px 0 0;
  font-size: 23px;
  font-weight: 680;
  letter-spacing: -0.5px;
}
.billing-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  color: var(--billing-muted);
  font-size: 13px;
}
.billing-loading--list {
  height: auto;
  padding: 40px 0;
}
.billing-statement {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 17px 18px 15px;
  border: 1px solid var(--billing-border);
  border-radius: var(--billing-radius-lg);
  background:
    linear-gradient(
      135deg,
      rgb(255 255 255 / 10%) 0%,
      rgb(255 255 255 / 0%) 58%
    ),
    linear-gradient(180deg, rgb(28 38 32 / 94%), rgb(10 13 12 / 97%));
  box-shadow:
    0 10px 30px rgb(0 0 0 / 46%),
    inset 0 1px 0 rgb(255 255 255 / 8%);
  color: #fff;
}
.billing-app--light .billing-statement {
  border-color: rgb(16 26 20 / 8%);
  background:
    linear-gradient(
      135deg,
      rgb(255 255 255 / 14%) 0%,
      rgb(255 255 255 / 0%) 58%
    ),
    linear-gradient(180deg, rgb(32 44 36 / 97%), rgb(14 18 16 / 99%));
  box-shadow:
    0 12px 26px rgb(20 40 26 / 20%),
    inset 0 1px 0 rgb(255 255 255 / 12%);
}
.billing-statement::after {
  position: absolute;
  right: -54px;
  bottom: -54px;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgb(201 242 76 / 14%),
    rgb(255 255 255 / 0%) 70%
  );
  content: '';
  pointer-events: none;
}
.billing-statement__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.billing-statement__label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgb(255 255 255 / 58%);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1.1px;
  text-transform: uppercase;
}
.billing-statement__amount {
  display: block;
  margin-top: 4px;
  font-size: 30px;
  font-weight: 650;
  letter-spacing: -0.6px;
  line-height: 1.1;
}
.billing-statement__mark {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    rgb(255 255 255 / 14%),
    rgb(255 255 255 / 3%)
  );
  color: var(--billing-accent);
}
.billing-statement__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
}
.billing-statement__figure strong {
  display: block;
  margin-top: 2px;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.2px;
}
.billing-statement__figure--overdue {
  text-align: right;
}
.billing-statement__figure--overdue .billing-statement__label,
.billing-statement__figure--overdue strong {
  justify-content: flex-end;
  color: #ff9d8f;
}
.billing-statement__figure--overdue.is-clear .billing-statement__label,
.billing-statement__figure--overdue.is-clear strong {
  color: rgb(255 255 255 / 58%);
}
.billing-statement__figure--overdue.is-clear strong {
  color: #fff;
}
.billing-filter-panel,
.billing-status-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.billing-filter-label {
  padding: 0 4px;
  color: var(--billing-muted);
  font-size: 10px;
  font-weight: 620;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.billing-direction :deep(button),
.billing-filters :deep(button) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
}
.billing-direction,
.billing-filters {
  --agent-app-accent: rgb(255 255 255 / 15%);
}
.billing-app--light .billing-direction,
.billing-app--light .billing-filters {
  --agent-app-accent: #2f4322;
}
.billing-direction :deep(.agent-segmented-button),
.billing-filters :deep(.agent-segmented-button) {
  color: var(--billing-muted);
}
.billing-filter-count {
  display: inline-grid;
  min-width: 17px;
  height: 17px;
  place-items: center;
  padding: 0 4px;
  border-radius: 999px;
  background: #ff453a;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
.billing-status-filter__scroll {
  overflow-x: auto;
  scrollbar-width: none;
}
.billing-status-filter__scroll::-webkit-scrollbar {
  display: none;
}
.billing-search :deep(.agent-searchbar__control) {
  border: 1px solid var(--billing-border);
  background: var(--billing-surface);
}
.billing-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px;
}

.billing-section-heading span {
  display: block;
  color: var(--billing-muted);
  font-size: 10px;
  font-weight: 620;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.billing-section-heading h2 {
  margin: 3px 0 0;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.3px;
}
.billing-section-heading :deep(.agent-link) {
  color: inherit;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.72;
}
.billing-card-list,
.billing-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.billing-invoice-card,
.billing-list-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 11px;
  border: 1px solid var(--billing-border);
  border-radius: var(--billing-radius-md);
  background: var(--billing-surface);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.14s ease,
    background 0.14s ease;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.billing-invoice-card:active,
.billing-list-row:active {
  transform: scale(0.985);
  background: var(--billing-surface-strong);
}
.billing-invoice-card {
  min-height: 88px;
  padding: 11px 13px;
}
.billing-issuer-mark {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--billing-border);
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    rgb(201 242 76 / 20%),
    rgb(201 242 76 / 5%)
  );
  color: #e6f8bd;
}
.billing-app--light .billing-issuer-mark {
  background: linear-gradient(
    180deg,
    rgb(63 107 31 / 15%),
    rgb(63 107 31 / 4%)
  );
  color: var(--billing-accent);
}
.billing-invoice-card__copy,
.billing-list-row__copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
}
.billing-invoice-card__copy strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.billing-invoice-card__copy small {
  overflow: hidden;
  color: var(--billing-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.billing-invoice-card__copy small:last-child {
  color: var(--billing-sub);
}
.billing-invoice-card__amount {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: auto 17px;
  align-items: center;
  justify-items: end;
  row-gap: 5px;
  column-gap: 4px;
}
.billing-invoice-card__amount .billing-status {
  grid-column: 1 / -1;
}
.billing-invoice-card__amount strong {
  font-size: 15px;
  font-weight: 680;
  letter-spacing: -0.3px;
  white-space: nowrap;
}
.billing-invoice-card__amount svg {
  color: var(--billing-sub);
}
.billing-status {
  padding: 2px 8px;
  border: 1px solid currentcolor;
  border-radius: 999px;
  background: transparent;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: none;
}
.billing-status--open {
  color: #6db3ff;
}
.billing-status--overdue {
  color: #ff9d8f;
}
.billing-status--processing {
  color: #ffc46b;
}
.billing-status--paid {
  color: #6fd398;
}
.billing-status--disputed {
  color: #d0a6ff;
}
.billing-status--cancelled,
.billing-status--refunded {
  color: var(--billing-muted);
}

.billing-app--light .billing-status--open {
  color: #1b62c4;
}

.billing-app--light .billing-status--overdue {
  color: #b3253c;
}

.billing-app--light .billing-status--processing {
  color: #9a6a10;
}

.billing-app--light .billing-status--paid {
  color: #1a7d4c;
}

.billing-app--light .billing-status--disputed {
  color: #6b3fa8;
}

.billing-list-row {
  min-height: 74px;
  padding: 11px 13px;
}
.billing-list-row.is-unread {
  box-shadow:
    inset 3px 0 0 var(--billing-accent),
    inset 0 1px 0 rgb(255 255 255 / 7%);
}
.billing-list-row__icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--billing-border);
  border-radius: 11px;
  background: var(--billing-surface-strong);
  color: var(--billing-muted);
}
.billing-list-row__copy strong {
  overflow: hidden;
  font-size: 13.5px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.billing-list-row__copy span {
  overflow: hidden;
  color: var(--billing-muted);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.billing-list-row__copy small {
  color: var(--billing-sub);
  font-size: 10px;
}
.billing-list-row__meta {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}
.billing-list-row__meta strong {
  font-size: 14px;
  font-weight: 680;
  white-space: nowrap;
}
.billing-load-more {
  align-self: center;
  margin-top: 2px;
  color: inherit;
  opacity: 0.75;
}

.billing-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  padding: 40px 26px;
  color: var(--billing-muted);
  text-align: center;
}
.billing-empty svg {
  color: var(--billing-accent);
  opacity: 0.8;
}
.billing-empty strong {
  color: inherit;
  font-size: 15px;
  font-weight: 650;
}
.billing-app:not(.billing-app--light) .billing-empty strong {
  color: #fff;
}

.billing-empty p {
  margin: 0;
  max-width: 240px;
  font-size: 12px;
  line-height: 1.5;
}
.billing-empty--list {
  padding: 34px 26px;
}
.billing-detail__hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 17px 18px 18px;
  border: 1px solid var(--billing-border);
  border-radius: var(--billing-radius-lg);
  background:
    linear-gradient(
      135deg,
      rgb(255 255 255 / 10%) 0%,
      rgb(255 255 255 / 0%) 58%
    ),
    linear-gradient(180deg, rgb(28 38 32 / 94%), rgb(10 13 12 / 97%));
  box-shadow:
    0 10px 30px rgb(0 0 0 / 42%),
    inset 0 1px 0 rgb(255 255 255 / 8%);
  color: #fff;
}
.billing-detail__hero--paid {
  align-items: center;
  gap: 6px;
  background:
    radial-gradient(120% 80% at 50% -10%, rgb(72 199 111 / 26%), transparent 62%),
    linear-gradient(180deg, rgb(18 40 30 / 92%), rgb(8 14 11 / 96%));
  text-align: center;
}
.billing-paid-mark {
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  border: 1px solid rgb(111 211 152 / 34%);
  border-radius: 50%;
  background: rgb(111 211 152 / 14%);
  color: #6fd398;
}
.billing-paid-title {
  color: #6fd398;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.billing-paid-amount {
  font-size: 30px;
  font-weight: 650;
  letter-spacing: -0.6px;
}
.billing-paid-date {
  color: rgb(255 255 255 / 60%);
  font-size: 11.5px;
}
.billing-detail__identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.billing-detail__identity strong {
  overflow: hidden;
  font-size: 16px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.billing-detail__identity span {
  color: rgb(255 255 255 / 52%);
  font-size: 10.5px;
  letter-spacing: 0.06em;
}

.billing-detail__hero .billing-status {
  align-self: flex-start;
}
.billing-detail__amount {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
  padding-top: 13px;
  border-top: 1px solid rgb(255 255 255 / 9%);
}
.billing-detail__amount span {
  color: rgb(255 255 255 / 58%);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1.1px;
  text-transform: uppercase;
}
.billing-detail__amount strong {
  font-size: 26px;
  font-weight: 680;
  letter-spacing: -0.6px;
}
.billing-detail__hero .billing-issuer-mark {
  width: 42px;
  height: 42px;
  border-radius: 13px;
}
.billing-detail__section-title {
  padding: 0 4px;
  color: var(--billing-muted);
  font-size: 11px;
  font-weight: 620;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.billing-panel,
.billing-note {
  margin-right: 0;
  margin-left: 0;
  overflow: hidden;
  border: 1px solid var(--billing-border);
  border-radius: var(--billing-radius-lg);
  background: var(--billing-surface);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%);
  color: inherit;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.billing-detail-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--billing-border);
}

.billing-detail-row:last-child {
  border-bottom: 0;
}
.billing-detail-row__icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--billing-border);
  border-radius: 10px;
  background: var(--billing-surface-strong);
  color: var(--billing-muted);
}
.billing-detail-row__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.billing-detail-row__copy small {
  color: var(--billing-muted);
  font-size: 10px;
  font-weight: 620;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.billing-detail-row__copy strong {
  font-size: 14px;
  font-weight: 600;
}
.billing-detail-row__reference {
  overflow-wrap: anywhere;
  font-family: var(--agent-font-mono, ui-monospace, monospace);
  font-size: 12.5px;
}
.billing-note {
  padding: 14px;
}
.billing-note span {
  display: block;
  margin-bottom: 5px;
  color: var(--billing-muted);
  font-size: 10px;
  font-weight: 620;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.billing-note p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.billing-detail__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.billing-detail__actions :deep(.agent-button) {
  display: inline-flex;
  width: 100%;
  height: 44px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 8px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
  transition:
    transform 0.14s ease,
    box-shadow 0.14s ease;
}

.billing-detail__actions :deep(.agent-button svg) {
  flex: 0 0 auto;
}
.billing-detail__actions :deep(.billing-action--pay) {
  border: 0;
  background: linear-gradient(180deg, #d6f766 0%, #bce33f 100%);
  box-shadow:
    0 10px 24px rgb(8 16 10 / 46%),
    inset 0 1px 0 rgb(255 255 255 / 55%);
  color: #14200c;
}
.billing-detail__actions :deep(.billing-action--dispute) {
  border: 1px solid var(--billing-border);
  background: var(--billing-surface);
  color: inherit;
}

.billing-app--light .billing-detail__actions :deep(.billing-action--pay) {
  background: linear-gradient(180deg, #22301a 0%, #131a10 100%);
  box-shadow:
    0 10px 22px rgb(24 44 20 / 26%),
    inset 0 1px 0 rgb(255 255 255 / 12%);
  color: #eaf7c8;
}
.billing-app--light .billing-detail__actions :deep(.billing-action--dispute) {
  background: rgb(255 255 255 / 82%);
}
.billing-action-chevron {
  transition: transform 0.14s ease;
}
@media (hover: hover) {
  .billing-detail__actions :deep(.billing-action:hover) {
    transform: translateY(-2px);
  }
  .billing-detail__actions :deep(.billing-action--pay:hover) {
    box-shadow:
      0 14px 28px rgb(8 16 10 / 52%),
      inset 0 1px 0 rgb(255 255 255 / 55%);
  }
  .billing-detail__actions :deep(.billing-action--dispute:hover) {
    background: var(--billing-surface-strong);
  }
  .billing-app--light
    .billing-detail__actions
    :deep(.billing-action--dispute:hover) {
    background: #fff;
  }
  .billing-detail__actions
    :deep(.billing-action:hover .billing-action-chevron) {
    transform: translateX(2px);
  }
}

.billing-tab-label {
  font-size: 10px;
}
.billing-tab-icon {
  position: relative;
  display: inline-grid;
  place-items: center;
}

.billing-tab-icon b {
  position: absolute;
  top: -5px;
  right: -9px;
  display: grid;
  min-width: 15px;
  height: 15px;
  place-items: center;
  padding: 0 4px;
  border-radius: 999px;
  background: #ff453a;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}
.billing-payment-sheet__content {
  display: grid;
  justify-items: center;
  gap: 13px;
  padding: 8px 18px 34px;
  color: inherit;
  text-align: center;
}

.billing-payment-sheet__icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 1px solid var(--billing-border);
  border-radius: 17px;
  background: linear-gradient(
    180deg,
    rgb(201 242 76 / 22%),
    rgb(201 242 76 / 5%)
  );
  color: var(--billing-accent);
}
.billing-payment-sheet h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 680;
  letter-spacing: -0.3px;
}
.billing-payment-sheet p {
  margin: 0;
  max-width: 260px;
  color: var(--billing-muted);
  font-size: 12px;
  line-height: 1.5;
}

.billing-payment-total {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--billing-border);
  border-radius: var(--billing-radius-md);
  background: var(--billing-surface);
  text-align: left;
}

.billing-payment-total span {
  overflow: hidden;
  color: var(--billing-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.billing-payment-total strong {
  font-size: 19px;
  font-weight: 680;
  letter-spacing: -0.3px;
  white-space: nowrap;
}

.billing-payment-sheet :deep(.agent-button) {
  width: 100%;
}
.billing-notification {
  z-index: 50;
}
@supports not (color: color-mix(in srgb, white, black)) {
  .billing-invoice-card,
  .billing-list-row,
  .billing-panel,
  .billing-note,
  .billing-payment-total,
  .billing-search :deep(.agent-searchbar__control) {
    background: var(--billing-panel);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
</style>