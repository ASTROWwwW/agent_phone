<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    body?: string
    compact?: boolean
    title?: string
    tone?: 'danger' | 'neutral'
  }>(),
  {
    body: '',
    compact: false,
    title: '',
    tone: 'neutral',
  },
)
</script>

<template>
  <section
    v-bind="$attrs"
    class="agent-empty-state"
    :class="[
      `agent-empty-state--${tone}`,
      { 'agent-empty-state--compact': compact },
    ]"
    :role="tone === 'danger' ? 'alert' : 'status'"
    :aria-live="tone === 'danger' ? 'assertive' : 'polite'"
    aria-atomic="true"
  >
    <span v-if="$slots.icon" class="agent-empty-state__icon">
      <slot name="icon" />
    </span>
    <strong v-if="title" class="agent-empty-state__title">{{ title }}</strong>
    <p v-if="body" class="agent-empty-state__body">{{ body }}</p>
    <div v-if="$slots.actions" class="agent-empty-state__actions">
      <slot name="actions" />
    </div>
  </section>
</template>
