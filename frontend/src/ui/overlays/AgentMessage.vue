<script setup lang="ts">
withDefaults(
  defineProps<{
    avatar?: string
    component?: string
    footer?: string
    header?: string
    id?: string
    name?: string
    text?: string
    textFooter?: string
    textHeader?: string
    type?: 'received' | 'sent'
  }>(),
  {
    component: 'div',
    name: '',
    textFooter: '',
    textHeader: '',
    type: 'sent',
  },
)
</script>

<template>
  <component
    :is="component"
    :id="id"
    class="agent-message"
    :class="`agent-message--${type}`"
  >
    <span v-if="avatar || $slots.avatar" class="agent-message__avatar">
      {{ avatar }}<slot name="avatar" />
    </span>
    <div class="agent-message__content">
      <div v-if="name || $slots.name" class="agent-message__name">
        {{ name }}<slot name="name" />
      </div>
      <div v-if="header || $slots.header" class="agent-message__header">
        {{ header }}<slot name="header" />
      </div>
      <div class="agent-message__bubble">
        <div
          v-if="textHeader || $slots.textHeader"
          class="agent-message__text-header"
        >
          {{ textHeader }}<slot name="textHeader" />
        </div>
        <div
          v-if="text || $slots.text || $slots.default"
          class="agent-message__text"
        >
          <slot name="text"
            ><slot>{{ text }}</slot></slot
          >
        </div>
        <div
          v-if="textFooter || $slots.textFooter"
          class="agent-message__text-footer"
        >
          {{ textFooter }}<slot name="textFooter" />
        </div>
        <div v-if="footer || $slots.footer" class="agent-message__footer">
          {{ footer }}<slot name="footer" />
        </div>
      </div>
    </div>
  </component>
</template>
