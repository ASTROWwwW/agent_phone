<script setup lang="ts">
import { ref } from 'vue'

import {
  AgentBlock,
  AgentBlockTitle,
  AgentCheckbox,
  AgentList,
  AgentListGroupInner,
  AgentListItem,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const checked1 = ref(false)
const checked2 = ref(true)
const group = ref(['Books'])
const movies = ref(['Movie 1'])
const media = ref(['Item 1'])

function toggleValue(collection: string[], value: string): string[] {
  return collection.includes(value)
    ? collection.filter((item) => item !== value)
    : [...collection, value]
}

function toggleGroupValue(value: string): void {
  group.value = toggleValue(group.value, value)
}

function toggleMovie(value: string): void {
  movies.value = toggleValue(movies.value, value)
}

function toggleMovies(): void {
  movies.value = movies.value.length === 2 ? [] : ['Movie 1', 'Movie 2']
}

function toggleMediaValue(value: string): void {
  media.value = toggleValue(media.value, value)
}

function handleCheckboxRowClick(event: MouseEvent, toggle: () => void): void {
  const target = event.target
  if (target instanceof Element && target.closest('.agent-checkbox')) return
  toggle()
}
</script>

<template>
  <AgentUiDemoPage class="checkbox-demo" title="Checkbox">
    <AgentBlockTitle>Inline</AgentBlockTitle>
    <AgentBlock inset strong>
      <p class="checkbox-demo__paragraph">
        Lorem
        <AgentCheckbox
          class="checkbox-demo__inline"
          aria-label="First inline checkbox"
          :checked="checked1"
          name="checkbox-1"
          @change="checked1 = !checked1"
        />
        ipsum dolor sit amet, consectetur adipisicing elit. Alias beatae illo
        nihil aut eius commodi sint eveniet aliquid eligendi
        <AgentCheckbox
          class="checkbox-demo__inline"
          aria-label="Second inline checkbox"
          :checked="checked2"
          name="checkbox-2"
          @change="checked2 = !checked2"
        />
        ad delectus impedit tempore nemo, enim vel praesentium consequatur nulla
        mollitia!
      </p>
    </AgentBlock>

    <AgentBlockTitle>Checkbox Group</AgentBlockTitle>
    <AgentList inset strong>
      <AgentListItem
        v-for="item in ['Books', 'Movies', 'Food', 'Drinks']"
        :key="item"
        :title="item"
        @click="handleCheckboxRowClick($event, () => toggleGroupValue(item))"
      >
        <template #media>
          <AgentCheckbox
            :aria-label="item"
            component="div"
            :checked="group.includes(item)"
            name="demo-checkbox"
            @change="toggleGroupValue(item)"
          />
        </template>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>Indeterminate State</AgentBlockTitle>
    <AgentList inset strong>
      <AgentListItem
        title="Movies"
        @click="handleCheckboxRowClick($event, toggleMovies)"
      >
        <template #media>
          <AgentCheckbox
            aria-label="Movies"
            component="div"
            :checked="movies.length === 2"
            :indeterminate="movies.length === 1"
            name="demo-movies-checkbox"
            @change="toggleMovies"
          />
        </template>
        <AgentList class="checkbox-demo__children" nested>
          <AgentListGroupInner>
            <AgentListItem
              v-for="movie in ['Movie 1', 'Movie 2']"
              :key="movie"
              :title="movie"
              @click.stop="
                handleCheckboxRowClick($event, () => toggleMovie(movie))
              "
            >
              <template #media>
                <AgentCheckbox
                  :aria-label="movie"
                  component="div"
                  :checked="movies.includes(movie)"
                  name="demo-movie-checkbox"
                  :value="movie"
                  @change="toggleMovie(movie)"
                />
              </template>
            </AgentListItem>
          </AgentListGroupInner>
        </AgentList>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>With Media Lists</AgentBlockTitle>
    <AgentList inset strong>
      <AgentListItem
        after="17:14"
        subtitle="New messages from John Doe"
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sagittis tellus ut turpis condimentum, ut dignissim lacus tincidunt. Cras dolor metus, ultrices condimentum sodales sit amet, pharetra sodales eros. Phasellus vel felis tellus. Mauris rutrum ligula nec dapibus feugiat. In vel dui laoreet, commodo augue id, pulvinar lacus."
        title="Facebook"
        @click="
          handleCheckboxRowClick($event, () => toggleMediaValue('Item 1'))
        "
      >
        <template #media>
          <AgentCheckbox
            aria-label="Facebook"
            component="div"
            :checked="media.includes('Item 1')"
            name="demo-media-checkbox"
            @change="toggleMediaValue('Item 1')"
          />
        </template>
      </AgentListItem>
      <AgentListItem
        after="17:11"
        subtitle="John Doe (@_johndoe) mentioned you on Twitter!"
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sagittis tellus ut turpis condimentum, ut dignissim lacus tincidunt. Cras dolor metus, ultrices condimentum sodales sit amet, pharetra sodales eros. Phasellus vel felis tellus. Mauris rutrum ligula nec dapibus feugiat. In vel dui laoreet, commodo augue id, pulvinar lacus."
        title="John Doe (via Twitter)"
        @click="
          handleCheckboxRowClick($event, () => toggleMediaValue('Item 2'))
        "
      >
        <template #media>
          <AgentCheckbox
            aria-label="John Doe via Twitter"
            component="div"
            :checked="media.includes('Item 2')"
            name="demo-media-checkbox"
            @change="toggleMediaValue('Item 2')"
          />
        </template>
      </AgentListItem>
    </AgentList>
  </AgentUiDemoPage>
</template>

<style scoped>
.checkbox-demo__paragraph {
  margin: 0;
}

.checkbox-demo__inline {
  min-width: 22px;
  min-height: 22px;
}

.checkbox-demo__inline :deep(.agent-checkbox__input) {
  width: var(--agent-touch-target);
  height: var(--agent-touch-target);
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.checkbox-demo :deep(.agent-list-item__row) {
  cursor: pointer;
}

.checkbox-demo__children {
  width: 100%;
  margin: 0;
  padding-left: 48px;
}
</style>
