<script setup lang="ts">
import AgentButton from '../controls/AgentButton.vue'

withDefaults(defineProps<{ disabled?: boolean; strong?: boolean }>(), {
  disabled: false,
  strong: false,
})
</script>

<template>
  <AgentButton
    class="agent-dialog-button"
    :class="{ 'agent-dialog-button--strong': strong }"
    :disabled="disabled"
    large
    rounded
    :tonal="!strong"
  >
    <slot />
  </AgentButton>
</template>
