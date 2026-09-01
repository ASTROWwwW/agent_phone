<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    ariaLabel?: string
    ariaDescribedby?: string
    ariaLabelledby?: string
    checked?: boolean
    component?: 'div' | 'label' | 'span'
    disabled?: boolean
    id?: string
    modelValue?: boolean
    name?: string
    readonly?: boolean
    value?: number | string
  }>(),
  {
    ariaLabel: '',
    ariaDescribedby: '',
    ariaLabelledby: '',
    checked: false,
    component: 'label',
    disabled: false,
    id: undefined,
    modelValue: undefined,
    name: undefined,
    readonly: false,
    value: undefined,
  },
)

const emit = defineEmits<{
  change: [event: Event]
  'update:modelValue': [value: boolean]
}>()

const generatedId = useId()
const isChecked = computed(() => props.modelValue ?? props.checked)
const input = ref<HTMLInputElement | null>(null)
const labelId = computed(() => `${props.id || generatedId}-label`)

function restoreReadonlyState(): void {
  void nextTick(() => {
    if (input.value) input.value.checked = isChecked.value
  })
}

function handleChange(event: Event): void {
  if (!(event.target instanceof HTMLInputElement)) return

  if (props.readonly) {
    event.target.checked = isChecked.value
    restoreReadonlyState()
    return
  }

  emit('update:modelValue', event.target.checked)
  emit('change', event)
}

function handleContainerClick(event: MouseEvent): void {
  if (props.disabled || props.readonly) {
    event.preventDefault()
    event.stopPropagation()
    restoreReadonlyState()
    return
  }

  if (props.component !== 'label' && event.target !== input.value) {
    event.preventDefault()
    input.value?.click()
  }
}
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-toggle"
    :class="{
      'agent-toggle--checked': isChecked,
      'agent-toggle--disabled': disabled,
      'agent-toggle--readonly': readonly,
    }"
    @click="handleContainerClick"
  >
    <input
      :id="id"
      ref="input"
      class="agent-toggle__input"
      type="checkbox"
      :aria-describedby="ariaDescribedby || undefined"
      role="switch"
      :aria-label="ariaLabel || undefined"
      :aria-labelledby="
        ariaLabelledby || (!ariaLabel && $slots.default ? labelId : undefined)
      "
      :aria-readonly="readonly || undefined"
      :checked="isChecked"
      :disabled="disabled"
      :name="name"
      :readonly="readonly"
      :value="value"
      @change="handleChange"
    />
    <span class="agent-toggle__track" aria-hidden="true">
      <span class="agent-toggle__thumb-side" />
      <span class="agent-toggle__thumb-bg" />
      <span class="agent-toggle__thumb-shadow" />
      <span class="agent-toggle__thumb-wrap">
        <span class="agent-toggle__thumb" />
      </span>
    </span>
    <span v-if="$slots.default" :id="labelId" class="agent-toggle__label">
      <slot />
    </span>
  </component>
</template>
