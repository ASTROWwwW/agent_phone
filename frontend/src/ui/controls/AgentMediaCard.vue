<script setup lang="ts">
import AgentCard from './AgentCard.vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    meta?: number | string
    title?: number | string
  }>(),
  {
    meta: undefined,
    title: undefined,
  },
)
</script>

<template>
  <AgentCard v-bind="$attrs" :content-wrap="false" class="agent-media-card">
    <div
      v-if="$slots.media || title !== undefined || $slots.title"
      class="agent-media-card__media"
    >
      <div v-if="$slots.media" class="agent-media-card__visual">
        <slot name="media" />
      </div>
      <strong
        v-if="title !== undefined || $slots.title"
        class="agent-media-card__title"
      >
        <slot name="title">{{ title }}</slot>
      </strong>
    </div>

    <div
      v-if="meta !== undefined || $slots.meta || $slots.default"
      class="agent-media-card__body"
    >
      <div
        v-if="meta !== undefined || $slots.meta"
        class="agent-media-card__meta"
      >
        <slot name="meta">{{ meta }}</slot>
      </div>
      <div v-if="$slots.default" class="agent-media-card__copy">
        <slot />
      </div>
    </div>

    <template v-if="$slots.actions" #footer>
      <div class="agent-media-card__actions">
        <slot name="actions" />
      </div>
    </template>
  </AgentCard>
</template>
