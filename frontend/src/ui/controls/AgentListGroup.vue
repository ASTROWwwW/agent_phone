<script setup lang="ts">
import AgentList from './AgentList.vue'
import AgentListGroupInner from './AgentListGroupInner.vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    density?: 'compact' | 'regular'
    dividers?: boolean
    flush?: boolean
    inset?: boolean
    menuList?: boolean
    outline?: boolean
    strong?: boolean
  }>(),
  {
    density: 'regular',
    dividers: true,
    flush: false,
    inset: false,
    menuList: false,
    outline: false,
    strong: false,
  },
)
</script>

<template>
  <li v-bind="$attrs" class="agent-list-group">
    <AgentList
      class="agent-list-group__list"
      :density="density"
      :dividers="dividers"
      :flush="flush"
      :inset="inset"
      :menu="menuList"
      nested
      :outline="outline"
      :strong="strong"
    >
      <AgentListGroupInner>
        <slot />
      </AgentListGroupInner>
    </AgentList>
  </li>
</template>
