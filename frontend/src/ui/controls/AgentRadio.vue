<script setup lang="ts">
import { computed, ref, useId } from 'vue'

defineOptions({ inheritAttrs: false })

type RadioValue = boolean | number | string

const props = withDefaults(
  defineProps<{
    ariaLabel?: string
    checked?: boolean
    disabled?: boolean
    modelValue?: RadioValue
    name?: string
    value: RadioValue
  }>(),
  {
    ariaLabel: '',
    checked: false,
    disabled: false,
    modelValue: undefined,
    name: undefined,
  },
)

const emit = defineEmits<{
  change: [event: Event]
  'update:modelValue': [value: RadioValue]
}>()

const input = ref<HTMLInputElement | null>(null)
const labelId = useId()
const isChecked = computed(() =>
  props.modelValue === undefined
    ? props.checked
    : props.modelValue === props.value,
)

function handleChange(event: Event): void {
  if (!(event.target instanceof HTMLInputElement) || !event.target.checked) {
    return
  }
  emit('update:modelValue', props.value)
  emit('change', event)
}

function handleClick(event: MouseEvent): void {
  if (
    props.disabled ||
    event.target === input.value ||
    event.defaultPrevented
  ) {
    return
  }
  input.value?.click()
}
</script>

<template>
  <span
    v-bind="$attrs"
    class="agent-radio"
    :class="{
      'agent-radio--checked': isChecked,
      'agent-radio--disabled': disabled,
    }"
    @click="handleClick"
  >
    <input
      ref="input"
      class="agent-radio__input"
      type="radio"
      :aria-label="ariaLabel || undefined"
      :aria-labelledby="!ariaLabel && $slots.default ? labelId : undefined"
      :checked="isChecked"
      :disabled="disabled"
      :name="name"
      :value="value"
      @change="handleChange"
    />
    <span class="agent-radio__mark" aria-hidden="true" />
    <span v-if="$slots.default" :id="labelId" class="agent-radio__label">
      <slot />
    </span>
  </span>
</template>
