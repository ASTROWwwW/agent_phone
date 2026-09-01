<script setup lang="ts">
import { ref } from 'vue'

import { AgentBlock, AgentBlockTitle, AgentList, AgentListItem, AgentRadio } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const inlineValue = ref('inline-1')
const groupValue = ref('Books')
const mediaValue = ref('Item 1')

const groupOptions = ['Books', 'Movies', 'Food', 'Drinks'] as const

function handleRadioRowClick(
  event: MouseEvent,
  value: string,
  group: 'group' | 'media',
): void {
  const target = event.target
  if (target instanceof Element && target.closest('.agent-radio')) return

  if (group === 'group') groupValue.value = value
  else mediaValue.value = value
}
</script>

<template>
  <AgentUiDemoPage title="Radio">
    <AgentBlockTitle>Inline</AgentBlockTitle>
    <AgentBlock inset strong>
      <p class="radio-demo__copy">
        Lorem
        <AgentRadio
          v-model="inlineValue"
          aria-label="First inline option"
          name="demo-radio-inline"
          value="inline-1"
        />
        ipsum dolor sit amet, consectetur adipisicing elit. Alias beatae illo
        nihil aut eius commodi sint eveniet aliquid eligendi
        <AgentRadio
          v-model="inlineValue"
          aria-label="Second inline option"
          name="demo-radio-inline"
          value="inline-2"
        />
        ad delectus impedit tempore nemo, enim vel praesentium consequatur nulla
        mollitia!
      </p>
    </AgentBlock>

    <AgentBlockTitle>Radio Group</AgentBlockTitle>
    <AgentList inset strong>
      <AgentListItem
        v-for="item in groupOptions"
        :key="`leading-${item}`"
        class="radio-demo__row"
        :title="item"
        @click="handleRadioRowClick($event, item, 'group')"
      >
        <template #media>
          <AgentRadio
            v-model="groupValue"
            :aria-label="item"
            name="demo-radio-group"
            :value="item"
          />
        </template>
      </AgentListItem>
    </AgentList>

    <AgentList inset strong>
      <AgentListItem
        v-for="item in groupOptions"
        :key="`trailing-${item}`"
        class="radio-demo__row"
        :title="item"
        @click="handleRadioRowClick($event, item, 'group')"
      >
        <template #after>
          <AgentRadio
            v-model="groupValue"
            :aria-label="item"
            name="demo-radio-group"
            :value="item"
          />
        </template>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>With Media Lists</AgentBlockTitle>
    <AgentList inset strong>
      <AgentListItem
        after="17:14"
        class="radio-demo__row"
        subtitle="New messages from John Doe"
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sagittis tellus ut turpis condimentum, ut dignissim lacus tincidunt. Cras dolor metus, ultrices condimentum sodales sit amet, pharetra sodales eros. Phasellus vel felis tellus. Mauris rutrum ligula nec dapibus feugiat. In vel dui laoreet, commodo augue id, pulvinar lacus."
        title="Facebook"
        @click="handleRadioRowClick($event, 'Item 1', 'media')"
      >
        <template #media>
          <AgentRadio
            v-model="mediaValue"
            aria-label="Facebook"
            name="demo-radio-media"
            value="Item 1"
          />
        </template>
      </AgentListItem>
      <AgentListItem
        after="17:11"
        class="radio-demo__row"
        subtitle="John Doe (@_johndoe) mentioned you on Twitter!"
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sagittis tellus ut turpis condimentum, ut dignissim lacus tincidunt. Cras dolor metus, ultrices condimentum sodales sit amet, pharetra sodales eros. Phasellus vel felis tellus. Mauris rutrum ligula nec dapibus feugiat. In vel dui laoreet, commodo augue id, pulvinar lacus."
        title="John Doe (via Twitter)"
        @click="handleRadioRowClick($event, 'Item 2', 'media')"
      >
        <template #media>
          <AgentRadio
            v-model="mediaValue"
            aria-label="John Doe via Twitter"
            name="demo-radio-media"
            value="Item 2"
          />
        </template>
      </AgentListItem>
    </AgentList>
  </AgentUiDemoPage>
</template>

<style scoped>
.radio-demo__copy {
  margin: 0;
}

.radio-demo__row :deep(.agent-list-item__row) {
  cursor: pointer;
}
</style>
