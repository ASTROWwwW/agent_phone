<script setup lang="ts">
import { ref } from 'vue'

import { AgentBlock, AgentBlockTitle, AgentChip, AgentChipDeleteIcon } from '@/ui'

import adamAvatar from '../assets/people-100x100-7.jpg'
import janeAvatar from '../assets/people-100x100-9.jpg'
import johnAvatar from '../assets/people-100x100-3.jpg'
import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const textChips = [
  'Example Chip',
  'Another Chip',
  'One More Chip',
  'Fourth Chip',
  'Last One',
]
const contacts = [
  { avatar: janeAvatar, name: 'Jane Doe' },
  { avatar: johnAvatar, name: 'John Doe' },
  { avatar: adamAvatar, name: 'Adam Smith' },
]
const deletableChips = ref([
  { avatar: '', id: 'example', name: 'Example Chip' },
  { avatar: adamAvatar, id: 'adam', name: 'Adam Smith' },
])
const colorChips = [
  { className: 'chips-demo__red', name: 'Red Chip' },
  { className: 'chips-demo__green', name: 'Green Chip' },
  { className: 'chips-demo__blue', name: 'Blue Chip' },
  { className: 'chips-demo__yellow', name: 'Yellow Chip' },
  { className: 'chips-demo__pink', name: 'Pink Chip' },
]

function deleteChip(id: string): void {
  deletableChips.value = deletableChips.value.filter((chip) => chip.id !== id)
}
</script>

<template>
  <AgentUiDemoPage class="chips-demo" title="Chips">
    <AgentBlockTitle>Chips With Text</AgentBlockTitle>
    <AgentBlock class="chips-demo__group" inset strong>
      <AgentChip v-for="chip in textChips" :key="chip" component="span">
        {{ chip }}
      </AgentChip>
    </AgentBlock>

    <AgentBlockTitle>Outline Chips</AgentBlockTitle>
    <AgentBlock class="chips-demo__group" inset strong>
      <AgentChip v-for="chip in textChips" :key="chip" component="span" outline>
        {{ chip }}
      </AgentChip>
    </AgentBlock>

    <AgentBlockTitle>Contact Chips</AgentBlockTitle>
    <AgentBlock class="chips-demo__group" inset strong>
      <AgentChip v-for="contact in contacts" :key="contact.name" component="span">
        <template #media>
          <img class="chips-demo__avatar" :src="contact.avatar" alt="" />
        </template>
        {{ contact.name }}
      </AgentChip>
    </AgentBlock>

    <AgentBlockTitle>Deletable Chips / Tags</AgentBlockTitle>
    <AgentBlock class="chips-demo__group" inset strong>
      <AgentChip
        v-for="chip in deletableChips"
        :key="chip.id"
        delete-button
        :delete-label="`Delete ${chip.name}`"
        @delete="deleteChip(chip.id)"
      >
        <template v-if="chip.avatar" #media>
          <img class="chips-demo__avatar" :src="chip.avatar" alt="" />
        </template>
        {{ chip.name }}
        <template #delete>
          <AgentChipDeleteIcon />
        </template>
      </AgentChip>
      <span v-if="deletableChips.length === 0" class="agent-ui-demo-copy">
        All chips deleted.
      </span>
    </AgentBlock>

    <AgentBlockTitle>Color Chips</AgentBlockTitle>
    <AgentBlock class="chips-demo__group" inset strong>
      <AgentChip
        v-for="chip in colorChips"
        :key="`fill-${chip.name}`"
        :class="chip.className"
        component="span"
        selected
      >
        {{ chip.name }}
      </AgentChip>
      <AgentChip
        v-for="chip in colorChips"
        :key="`outline-${chip.name}`"
        :class="chip.className"
        component="span"
        outline
      >
        {{ chip.name }}
      </AgentChip>
    </AgentBlock>
  </AgentUiDemoPage>
</template>

<style scoped>
.chips-demo__group :deep(.agent-chip) {
  margin: 2px;
}

.chips-demo__avatar {
  width: 28px;
  height: 28px;
  display: block;
  border-radius: 50%;
  object-fit: cover;
}

.chips-demo__red {
  --agent-app-accent: #fb2c36;
  --agent-app-accent-soft: rgba(251, 44, 54, 0.16);
  --agent-chip-outline-border: #fb2c36;
  --agent-chip-outline-text: #fb2c36;
}

.chips-demo__green {
  --agent-app-accent: #00c951;
  --agent-app-accent-soft: rgba(0, 201, 81, 0.16);
  --agent-chip-outline-border: #00c951;
  --agent-chip-outline-text: #00c951;
}

.chips-demo__blue {
  --agent-app-accent: #2b7fff;
  --agent-app-accent-soft: rgba(43, 127, 255, 0.16);
  --agent-chip-outline-border: #2b7fff;
  --agent-chip-outline-text: #2b7fff;
}

.chips-demo__yellow {
  --agent-app-accent: #f0b100;
  --agent-app-accent-soft: rgba(240, 177, 0, 0.16);
  --agent-chip-outline-border: #f0b100;
  --agent-chip-outline-text: #f0b100;
}

.chips-demo__pink {
  --agent-app-accent: #f6339a;
  --agent-app-accent-soft: rgba(246, 51, 154, 0.16);
  --agent-chip-outline-border: #f6339a;
  --agent-chip-outline-text: #f6339a;
}
</style>
