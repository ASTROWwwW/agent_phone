<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    ariaLabel?: string
    bgClass?: string
    component?: 'div' | 'footer' | 'header' | 'nav'
    innerClass?: string
    outline?: boolean
    tabbar?: boolean
    tabbarIcons?: boolean
    tabbarLabels?: boolean
    top?: boolean
  }>(),
  {
    ariaLabel: '',
    bgClass: '',
    component: 'div',
    innerClass: '',
    outline: false,
    tabbar: false,
    tabbarIcons: false,
    tabbarLabels: false,
    top: false,
  },
)
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-toolbar"
    :class="{
      'agent-toolbar--outline': outline,
      'agent-toolbar--tabbar': tabbar,
      'agent-toolbar--tabbar-icons': tabbarIcons,
      'agent-toolbar--tabbar-labels': tabbarLabels,
      'agent-toolbar--top': top,
    }"
    :aria-label="ariaLabel || undefined"
    :aria-orientation="tabbar ? undefined : 'horizontal'"
    :role="tabbar ? 'tablist' : 'toolbar'"
  >
    <span class="agent-toolbar__blur" aria-hidden="true" />
    <span class="agent-toolbar__background" :class="bgClass" aria-hidden="true" />
    <div class="agent-toolbar__inner" :class="innerClass">
      <slot />
    </div>
  </component>
</template>
