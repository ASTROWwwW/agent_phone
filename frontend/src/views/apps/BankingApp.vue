<script setup lang="ts">
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  House,
  Landmark,
  Search,
  Send,
} from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { useBankingStore } from '@/stores/banking'
import { useCallsStore } from '@/stores/calls'
import { usePhoneStore } from '@/stores/phone'
import type {
  BankingAction,
  BankingTransaction,
  BankingTransactionKind,
} from '@/types/banking'
import type { PhoneContact } from '@/types/phone'
import {
  normalizeBankingAmountInput,
  parseBankingAmount,
} from '@/utils/bankingAmount'
import { handleEnterAction } from '@/utils/keyboard'
import { formatPhoneNumber, normalizePhoneNumber } from '@/utils/phone'
import {
  SkyAppPage,
  SkyButton,
  SkyCard,
  SkyEmptyState,
  SkyField,
  SkyGlass,
  SkyLink,
  SkyList,
  SkyListItem,
  SkyNavbar,
  SkySheet,
  SkySpinner,
  SkyTabBar,
  SkyTabButton,
  SkyNotification,
} from '@/ui'

type BankingTab = 'home' | 'activity'
type BankingFilter = 'all' | 'income' | 'expenses' | 'transfers'

const phone = usePhoneStore()
const banking = useBankingStore()
const calls = useCallsStore()
const activeTab = ref<BankingTab>('home')
const activeFilter = ref<BankingFilter>('all')
const search = ref('')
const action = ref<BankingAction | null>(null)
const selectedTransaction = ref<BankingTransaction | null>(null)
const amount = ref('')
const target = ref('')
const formError = ref('')
const bankingScroll = ref<HTMLElement | null>(null)
const cooldownToastOpened = ref(false)
const overlayOpened = computed(() =>
  Boolean(action.value || selectedTransaction.value),
)

let cooldownToastTimer: ReturnType<typeof setTimeout> | undefined

const {
  finishPull,
  movePull,
  pullDistance,
  pullThreshold,
  pullWithWheel,
  startPull,
} = usePullToRefresh({
  isAtTop: () => (bankingScroll.value?.scrollTop ?? 0) <= 0,
  refresh: () => banking.load(true),
})

function closeCooldownToast(): void {
  cooldownToastOpened.value = false
  if (banking.error === 'reload_cooldown') banking.error = ''
}

const transactionIcons: Record<BankingTransactionKind, typeof Send> = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  transfer_in: ArrowDownLeft,
  transfer_out: ArrowUpRight,
}

const isIncoming = (kind: BankingTransactionKind): boolean =>
  kind === 'deposit' || kind === 'transfer_in'

const isTransfer = (kind: BankingTransactionKind): boolean =>
  kind === 'transfer_in' || kind === 'transfer_out'

const transactions = computed(() => banking.overview?.transactions ?? [])

const chart = computed(() => {
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - offset))
    return { date, incoming: 0, outgoing: 0 }
  })
  for (const transaction of transactions.value) {
    const transactionDate = new Date(transaction.createdAt)
    transactionDate.setHours(0, 0, 0, 0)
    const day = days.find(
      (candidate) => candidate.date.getTime() === transactionDate.getTime(),
    )
    if (!day) continue
    if (isIncoming(transaction.kind)) day.incoming += transaction.amount
    else day.outgoing += transaction.amount
  }
  const maximum = Math.max(
    1,
    ...days.flatMap((day) => [day.incoming, day.outgoing]),
  )
  return days.map((day) => ({
    ...day,
    incomingHeight: Math.max(4, (day.incoming / maximum) * 100),
    label: new Intl.DateTimeFormat(phone.lang, { weekday: 'narrow' }).format(
      day.date,
    ),
    outgoingHeight: Math.max(4, (day.outgoing / maximum) * 100),
  }))
})

// Graduation de l'axe vertical : quatre paliers sur le maximum reel de la
// semaine, arrondis pour rester lisibles.
const chartScale = computed(() => {
  const maximum = Math.max(
    1,
    ...chart.value.flatMap((day) => [day.incoming, day.outgoing]),
  )
  return [4, 3, 2, 1].map((step) => compactMoney((maximum / 4) * step))
})

const totals = computed(() =>
  transactions.value.reduce(
    (result, transaction) => {
      if (isIncoming(transaction.kind)) result.incoming += transaction.amount
      else result.outgoing += transaction.amount
      if (isTransfer(transaction.kind)) result.transfers += transaction.amount
      return result
    },
    { incoming: 0, outgoing: 0, transfers: 0 },
  ),
)

const filteredTransactions = computed(() => {
  const query = search.value.trim().toLowerCase()
  return transactions.value.filter((transaction) => {
    if (activeFilter.value === 'income' && !isIncoming(transaction.kind))
      return false
    if (activeFilter.value === 'expenses' && isIncoming(transaction.kind))
      return false
    if (activeFilter.value === 'transfers' && !isTransfer(transaction.kind))
      return false
    if (!query) return true
    return `${transactionTitle(transaction)} ${transaction.reference}`
      .toLowerCase()
      .includes(query)
  })
})

// Numero de compte affiche sur la carte. Le backend n'en expose pas : on le
// derive de l'identifiant du joueur, stable pour un meme personnage.
const accountNumber = computed(() => {
  const id = banking.overview?.playerId
  return id === undefined ? '—' : `FLE-${String(id).padStart(4, '0')}`
})

const cardHolder = computed(() =>
  (banking.overview?.playerName ?? '').toUpperCase(),
)

function formatMoney(value: number, signed = false): string {
  const formatted = new Intl.NumberFormat(phone.lang, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.abs(value))
  const prefix = signed ? (value >= 0 ? '+' : '−') : ''
  return `${prefix}${banking.overview?.currency ?? '$'}${formatted}`
}

function compactMoney(value: number): string {
  return new Intl.NumberFormat(phone.lang, {
    maximumFractionDigits: value >= 10000 ? 0 : 1,
    notation: 'compact',
  }).format(value)
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(phone.lang, {
    day: 'numeric',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: 'short',
  }).format(timestamp)
}

function transactionTitle(transaction: BankingTransaction): string {
  if (transaction.label) return transaction.label
  return phone.t(`Apps.banking.transactions.${transaction.kind}`)
}

async function selectTab(nextTab: BankingTab): Promise<void> {
  if (activeTab.value === nextTab) return
  activeTab.value = nextTab
  await nextTick()
  if (bankingScroll.value) bankingScroll.value.scrollTop = 0
}

function selectFilter(nextFilter: BankingFilter): void {
  activeFilter.value = nextFilter
}

function updateSearch(event: Event): void {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('[banking] Search input emitted without an input target.')
    return
  }
  search.value = event.target.value
}

function openAction(nextAction: BankingAction): void {
  selectedTransaction.value = null
  action.value = nextAction
  amount.value = ''
  target.value = ''
  formError.value = ''
  void calls.loadContacts()
}

function closeAction(): void {
  if (action.value && banking.isLoading) return
  action.value = null
  selectedTransaction.value = null
}

function openTransaction(transaction: BankingTransaction): void {
  action.value = null
  selectedTransaction.value = transaction
}

function updateTarget(event: Event): void {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error(
      '[banking] Phone number input emitted without an input target.',
    )
    return
  }
  target.value = event.target.value
  formError.value = ''
}

function selectContact(contact: PhoneContact): void {
  target.value = contact.phone_number
  formError.value = ''
  void nextTick(() =>
    document.getElementById('banking-transfer-amount')?.focus(),
  )
}

function updateAmount(event: Event): void {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('[banking] Amount input emitted without an input target.')
    return
  }
  const normalizedAmount = normalizeBankingAmountInput(event.target.value)
  if (event.target.value !== normalizedAmount) {
    event.target.value = normalizedAmount
  }
  amount.value = normalizedAmount
  formError.value = ''
}

function errorMessage(code: string): string {
  return phone.t(`Apps.banking.errors.${code}`) ===
    `Apps.banking.errors.${code}`
    ? phone.t('Apps.banking.errors.default')
    : phone.t(`Apps.banking.errors.${code}`)
}

async function submitAction(): Promise<void> {
  if (!action.value) return
  const parsedAmount = parseBankingAmount(amount.value)
  const phoneNumber =
    action.value === 'transfer' ? normalizePhoneNumber(target.value) : undefined
  if (parsedAmount === null || (action.value === 'transfer' && !phoneNumber)) {
    formError.value = phone.t('Apps.banking.errors.invalid_request')
    return
  }
  const response = await banking.perform(
    action.value,
    parsedAmount,
    phoneNumber ?? undefined,
  )
  if (!response.success) {
    formError.value = errorMessage(response.error ?? 'default')
    return
  }
  action.value = null
}

onMounted(() => {
  void banking.load()
})

watch(
  () => banking.error,
  (error) => {
    if (error !== 'reload_cooldown') return
    if (cooldownToastTimer) clearTimeout(cooldownToastTimer)
    cooldownToastOpened.value = true
    cooldownToastTimer = setTimeout(closeCooldownToast, 2800)
  },
)

watch(action, async (currentAction) => {
  if (currentAction) {
    await nextTick()
    document.getElementById('banking-transfer-target')?.focus()
  }
})

onBeforeUnmount(() => {
  if (cooldownToastTimer) clearTimeout(cooldownToastTimer)
})
</script>

<template>
  <SkyAppPage
    class="banking-app pb-safe-24"
    :label="phone.t('Apps.banking.name')"
    :dark="phone.isDarkMode"
    accent="#e8e8e8"
    accent-soft="rgba(255, 255, 255, 0.08)"
  >
    <SkyNavbar
      class="banking-navbar"
      :aria-hidden="overlayOpened"
      :inert="overlayOpened"
    >
      <template #title>
        <span class="banking-brand">
          <span class="banking-brand__name">FLEECA</span>
          <span class="banking-brand__sub">B A N K</span>
        </span>
      </template>
    </SkyNavbar>

    <div
      v-if="!banking.overview && banking.isLoading"
      class="banking-loading"
      :aria-hidden="overlayOpened"
      :inert="overlayOpened"
    >
      <SkySpinner :label="phone.t('Common.loading')" />
      <span>{{ phone.t('Common.loading') }}</span>
    </div>

    <SkyEmptyState
      v-else-if="!banking.overview"
      class="banking-empty"
      :aria-hidden="overlayOpened"
      :body="errorMessage(banking.error)"
      :inert="overlayOpened"
      :title="phone.t('Apps.banking.unavailable')"
    >
      <template #icon><Landmark :size="34" /></template>
      <template #actions>
        <SkyButton rounded @click="banking.load(true)">
          {{ phone.t('Apps.banking.tryAgain') }}
        </SkyButton>
      </template>
    </SkyEmptyState>

    <div
      v-else
      ref="bankingScroll"
      class="banking-scroll"
      :class="{ 'is-locked': overlayOpened }"
      :aria-hidden="overlayOpened"
      :inert="overlayOpened"
      @touchend="finishPull"
      @touchmove.passive="movePull"
      @touchstart.passive="startPull"
      @wheel="pullWithWheel"
    >
      <div
        class="banking-pull-refresh"
        :class="{ 'is-visible': pullDistance > 0 }"
        :style="{ transform: `translateY(${pullDistance - pullThreshold}px)` }"
        aria-live="polite"
      >
        <SkySpinner :label="phone.t('Common.loading')" />
      </div>

      <template v-if="activeTab === 'home'">
        <article class="banking-debit-card">
          <header class="banking-debit-card__top">
            <div>
              <span class="banking-debit-card__label">
                {{ phone.t('Apps.banking.accountNumber') }}
              </span>
              <strong class="banking-debit-card__iban">{{
                accountNumber
              }}</strong>
            </div>
            <svg
              class="banking-debit-card__wave"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 8a6 6 0 0 1 0 8" />
              <path d="M12 5a9 9 0 0 1 0 14" />
              <path d="M16 2a12 12 0 0 1 0 20" />
            </svg>
          </header>

          <span class="banking-debit-card__chip" aria-hidden="true"></span>

          <p class="banking-debit-card__balance-label">
            {{ phone.t('Apps.banking.totalBalance') }}
          </p>
          <strong class="banking-debit-card__balance">
            {{ formatMoney(banking.overview.bank) }}
          </strong>

          <footer class="banking-debit-card__bottom">
            <div>
              <span class="banking-debit-card__label">
                {{ phone.t('Apps.banking.debitCard') }}
              </span>
              <span class="banking-debit-card__holder">{{ cardHolder }}</span>
            </div>
            <div class="banking-debit-card__cash">
              <span class="banking-debit-card__label">
                {{ phone.t('Apps.banking.cash') }}
              </span>
              <span class="banking-debit-card__holder">{{
                formatMoney(banking.overview.cash)
              }}</span>
            </div>
          </footer>
        </article>

        <section
          class="banking-stats"
          :aria-label="phone.t('Apps.banking.recentPeriod')"
        >
          <SkyGlass class="banking-stat">
            <span class="banking-stat__icon"><ArrowDownLeft :size="17" /></span>
            <span class="banking-stat__label">{{
              phone.t('Apps.banking.totalIncome')
            }}</span>
            <b class="banking-stat__amount is-incoming">{{
              formatMoney(totals.incoming)
            }}</b>
          </SkyGlass>
          <SkyGlass class="banking-stat">
            <span class="banking-stat__icon"><ArrowUpRight :size="17" /></span>
            <span class="banking-stat__label">{{
              phone.t('Apps.banking.totalExpenses')
            }}</span>
            <b class="banking-stat__amount">{{ formatMoney(totals.outgoing) }}</b>
          </SkyGlass>
          <SkyGlass class="banking-stat">
            <span class="banking-stat__icon"
              ><ArrowLeftRight :size="17"
            /></span>
            <span class="banking-stat__label">{{
              phone.t('Apps.banking.totalTransfers')
            }}</span>
            <b class="banking-stat__amount">{{
              formatMoney(totals.transfers)
            }}</b>
          </SkyGlass>
        </section>

        <SkyGlass
          component="button"
          type="button"
          class="banking-transfer"
          @click="openAction('transfer')"
        >
          <span class="banking-transfer__icon"><Send :size="18" /></span>
          <span class="banking-transfer__copy">
            <b>{{ phone.t('Apps.banking.quickTransfer') }}</b>
            <small>{{ phone.t('Apps.banking.quickTransferBody') }}</small>
          </span>
          <ChevronRight :size="17" aria-hidden="true" />
        </SkyGlass>

        <section class="banking-panel">
          <div class="banking-panel__head">
            <h2>{{ phone.t('Apps.banking.latestTransactions') }}</h2>
            <SkyLink
              component="button"
              type="button"
              @click="selectTab('activity')"
            >
              {{ phone.t('Apps.banking.viewAll') }}
            </SkyLink>
          </div>
          <SkyList
            v-if="transactions.length"
            inset
            strong
            class="banking-transaction-list"
          >
            <SkyListItem
              v-for="transaction in transactions.slice(0, 5)"
              :key="transaction.id"
              :subtitle="formatDate(transaction.createdAt)"
              :title="transactionTitle(transaction)"
              link
              link-component="button"
              @click="openTransaction(transaction)"
            >
              <template #media>
                <component :is="transactionIcons[transaction.kind]" :size="17" />
              </template>
              <template #after>
                <b :class="{ 'is-incoming': isIncoming(transaction.kind) }">
                  {{
                    formatMoney(
                      isIncoming(transaction.kind)
                        ? transaction.amount
                        : -transaction.amount,
                      true,
                    )
                  }}
                </b>
              </template>
            </SkyListItem>
          </SkyList>
          <p v-else class="banking-no-transactions">
            {{ phone.t('Apps.banking.noTransactions') }}
          </p>
        </section>
      </template>

      <template v-else>
        <SkyCard :content-wrap="false" class="banking-analytics">
          <div class="banking-analytics__head">
            <h2>{{ phone.t('Apps.banking.analytics') }}</h2>
            <span class="banking-analytics__period">{{
              phone.t('Apps.banking.thisWeek')
            }}</span>
          </div>
          <div class="banking-analytics__legend">
            <span
              ><i class="is-incoming"></i
              >{{ phone.t('Apps.banking.incoming') }}</span
            >
            <span><i></i>{{ phone.t('Apps.banking.outgoing') }}</span>
          </div>
          <div class="banking-chart">
            <div class="banking-chart__axis" aria-hidden="true">
              <span v-for="step in chartScale" :key="step">{{ step }}</span>
            </div>
            <div class="banking-chart__grid" aria-hidden="true">
              <i v-for="line in 4" :key="line"></i>
            </div>
            <div class="banking-chart__days">
              <div
                v-for="day in chart"
                :key="day.date.getTime()"
                class="banking-chart__day"
                role="img"
                :aria-label="
                  phone.t('Apps.banking.chartDaySummary', {
                    day: day.label,
                    incoming: formatMoney(day.incoming),
                    outgoing: formatMoney(day.outgoing),
                  })
                "
              >
                <div class="banking-chart__bars">
                  <i
                    class="is-incoming"
                    :style="{ height: `${day.incomingHeight}%` }"
                  ></i>
                  <i :style="{ height: `${day.outgoingHeight}%` }"></i>
                </div>
                <span>{{ day.label }}</span>
              </div>
            </div>
          </div>
        </SkyCard>

        <label class="banking-search">
          <Search :size="16" aria-hidden="true" />
          <input
            :placeholder="phone.t('Apps.banking.searchPlaceholder')"
            :value="search"
            inputmode="search"
            type="search"
            @input="updateSearch"
          />
        </label>

        <div
          class="banking-filters"
          role="tablist"
          :aria-label="phone.t('Apps.banking.allTransactions')"
        >
          <button
            v-for="filter in ['all', 'income', 'expenses', 'transfers'] as const"
            :key="filter"
            class="banking-filter"
            :class="{ 'is-active': activeFilter === filter }"
            role="tab"
            type="button"
            :aria-selected="activeFilter === filter"
            @click="selectFilter(filter)"
          >
            {{ phone.t(`Apps.banking.filters.${filter}`) }}
          </button>
        </div>

        <section class="banking-panel">
          <div class="banking-panel__head">
            <h2>{{ phone.t('Apps.banking.allTransactions') }}</h2>
            <span class="banking-panel__count">{{
              filteredTransactions.length
            }}</span>
          </div>
          <SkyList
            v-if="filteredTransactions.length"
            inset
            strong
            class="banking-transaction-list"
          >
            <SkyListItem
              v-for="transaction in filteredTransactions"
              :key="transaction.id"
              :subtitle="formatDate(transaction.createdAt)"
              :title="transactionTitle(transaction)"
              link
              link-component="button"
              @click="openTransaction(transaction)"
            >
              <template #media>
                <component :is="transactionIcons[transaction.kind]" :size="17" />
              </template>
              <template #after>
                <b :class="{ 'is-incoming': isIncoming(transaction.kind) }">
                  {{
                    formatMoney(
                      isIncoming(transaction.kind)
                        ? transaction.amount
                        : -transaction.amount,
                      true,
                    )
                  }}
                </b>
              </template>
            </SkyListItem>
          </SkyList>
          <p v-else class="banking-no-transactions">
            {{
              transactions.length
                ? phone.t('Apps.banking.noResults')
                : phone.t('Apps.banking.noTransactions')
            }}
          </p>
        </section>
      </template>
    </div>

    <SkyTabBar
      v-if="banking.overview"
      icons
      labels
      class="banking-tabbar"
      :aria-hidden="overlayOpened"
      :inert="overlayOpened"
      :label="phone.t('Apps.banking.navigation')"
    >
      <SkyTabButton
        :active="activeTab === 'home'"
        :label="phone.t('Apps.banking.home')"
        @click="selectTab('home')"
      >
        <template #icon><House :size="25" /></template>
      </SkyTabButton>
      <SkyTabButton
        :active="activeTab === 'activity'"
        :label="phone.t('Apps.banking.activity')"
        @click="selectTab('activity')"
      >
        <template #icon><BarChart3 :size="25" /></template>
      </SkyTabButton>
    </SkyTabBar>

    <SkySheet
      :opened="overlayOpened"
      :ariaLabelledby="
        action
          ? `banking-${action}-title`
          : selectedTransaction
            ? 'banking-transaction-detail-title'
            : undefined
      "
      swipe-to-close
      grabber-clickable
      :grabber-label="phone.t('Common.close')"
      @backdropclick="closeAction"
      @escape="closeAction"
      @grabberclick="closeAction"
      @swipeclose="closeAction"
    >
      <section v-if="action" class="banking-sheet__content">
        <span class="banking-modal__icon">
          <Send :size="23" />
        </span>
        <h2 :id="`banking-${action}-title`">
          {{ phone.t(`Apps.banking.forms.${action}.title`) }}
        </h2>
        <p>{{ phone.t(`Apps.banking.forms.${action}.body`) }}</p>
        <SkyList aria-live="polite" inset strong class="banking-form-list">
          <SkyField
            :label="phone.t('Apps.banking.recipientPhone')"
            input-id="banking-transfer-target"
            inputmode="tel"
            outline
            :placeholder="phone.t('Apps.banking.recipientPhonePlaceholder')"
            type="tel"
            :value="target"
            @input="updateTarget"
          />
          <SkyField
            autocomplete="off"
            class="banking-amount-field"
            :label="phone.t('Apps.banking.amount')"
            :error="formError || false"
            input-id="banking-transfer-amount"
            inputmode="decimal"
            outline
            pattern="[0-9]+([,][0-9]{0,2})?"
            :placeholder="phone.t('Apps.banking.amountPlaceholder')"
            type="text"
            :value="amount"
            @input="updateAmount"
            @keydown.enter="handleEnterAction($event, submitAction)"
          />
        </SkyList>
        <div class="banking-contact-picker">
          <span>{{ phone.t('Apps.banking.chooseContact') }}</span>
          <SkyList v-if="calls.contacts.length" inset strong>
            <SkyListItem
              v-for="contact in calls.contacts"
              :key="contact.id"
              :title="contact.name"
              :subtitle="formatPhoneNumber(contact.phone_number)"
              link
              link-component="button"
              @click="selectContact(contact)"
            />
          </SkyList>
          <p v-else>{{ phone.t('Apps.banking.noContacts') }}</p>
        </div>
        <SkyButton
          block
          large
          rounded
          :disabled="banking.isLoading"
          @click="submitAction"
        >
          <SkySpinner
            v-if="banking.isLoading"
            :label="phone.t('Common.loading')"
            :size="20"
          />
          <template v-else>
            {{ phone.t(`Apps.banking.forms.${action}.submit`) }}
            <ArrowRight :size="17" />
          </template>
        </SkyButton>
      </section>
      <section
        v-else-if="selectedTransaction"
        class="banking-sheet__content banking-transaction-detail"
      >
        <span
          class="banking-modal__icon banking-transaction-detail__icon"
          :class="{
            'is-incoming': isIncoming(selectedTransaction.kind),
          }"
        >
          <component
            :is="transactionIcons[selectedTransaction.kind]"
            :size="23"
          />
        </span>
        <p class="banking-transaction-detail__eyebrow">
          {{ phone.t('Apps.banking.transactionDetails') }}
        </p>
        <h2 id="banking-transaction-detail-title">
          {{ transactionTitle(selectedTransaction) }}
        </h2>
        <strong
          class="banking-transaction-detail__amount"
          :class="{
            'is-incoming': isIncoming(selectedTransaction.kind),
          }"
        >
          {{
            formatMoney(
              isIncoming(selectedTransaction.kind)
                ? selectedTransaction.amount
                : -selectedTransaction.amount,
              true,
            )
          }}
        </strong>
        <SkyList inset strong class="banking-transaction-detail__list">
          <SkyListItem
            :title="phone.t('Apps.banking.transactionDate')"
            :after="formatDate(selectedTransaction.createdAt)"
          />
          <SkyListItem
            :title="phone.t('Apps.banking.transactionDirection')"
            :after="
              phone.t(
                isIncoming(selectedTransaction.kind)
                  ? 'Apps.banking.incoming'
                  : 'Apps.banking.outgoing',
              )
            "
          />
          <SkyListItem
            v-if="selectedTransaction.reference"
            :title="phone.t('Apps.banking.transactionReference')"
            :subtitle="selectedTransaction.reference"
          />
        </SkyList>
      </section>
    </SkySheet>

    <SkyNotification
      :opened="cooldownToastOpened"
      :text="errorMessage('reload_cooldown')"
      @click="closeCooldownToast"
    />
  </SkyAppPage>
</template>
