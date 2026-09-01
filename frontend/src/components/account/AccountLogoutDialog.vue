<script setup lang="ts">
import { AgentDialog as kDialog, AgentDialogButton as kDialogButton } from '@/ui'

import { useAppAuthStore, type AppAuthId } from '@/stores/app-auth'
import { useFeatherStore } from '@/stores/feather'
import { useMarketplaceStore } from '@/stores/marketplace'
import { usePhoneStore } from '@/stores/phone'

const opened = defineModel<boolean>('opened', { default: false })
const emit = defineEmits<{ loggedOut: [] }>()
const props = defineProps<{ appId: AppAuthId; appName: string }>()

const appAuth = useAppAuthStore()
const feather = useFeatherStore()
const marketplace = useMarketplaceStore()
const phone = usePhoneStore()

function close(): void {
  opened.value = false
}

function confirmLogout(): void {
  appAuth.signOut(props.appId)
  if (props.appId === 'citymarkt') marketplace.$reset()
  if (props.appId === 'feather') feather.$reset()
  opened.value = false
  emit('loggedOut')
}
</script>

<template>
  <k-dialog :opened="opened" @backdropclick="close">
    <template #title>{{
      phone.t('Common.signOutTitle', { app: appName })
    }}</template>
    <p>{{ phone.t('Common.signOutBody', { app: appName }) }}</p>
    <template #buttons>
      <k-dialog-button @click="close">
        {{ phone.t('Common.cancel') }}
      </k-dialog-button>
      <k-dialog-button
        strong
        class="account-logout-confirm"
        @click="confirmLogout"
      >
        {{ phone.t('Common.signOut') }}
      </k-dialog-button>
    </template>
  </k-dialog>
</template>

<style scoped>
.account-logout-confirm {
  background: #e44760 !important;
  color: #fff !important;
}
</style>
