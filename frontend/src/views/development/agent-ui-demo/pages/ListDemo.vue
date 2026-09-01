<script setup lang="ts">
import {
  AgentBadge,
  AgentBlock,
  AgentBlockTitle,
  AgentList,
  AgentListGroup,
  AgentListItem,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
import albumOne from '../assets/people-160x160-1.jpg'
import albumTwo from '../assets/people-160x160-2.jpg'
import albumThree from '../assets/people-160x160-3.jpg'
import demoIcon from '../assets/demo-icon.png'

const people = ['Ivan Petrov', 'John Doe', 'Jenna Smith']
const alphabetGroups = [
  { letter: 'A', names: ['Aaron', 'Abbie', 'Adam'] },
  { letter: 'B', names: ['Bailey', 'Barclay', 'Bartolo'] },
  { letter: 'C', names: ['Caiden', 'Calvin', 'Candy'] },
]
const songs = [
  {
    artist: 'Beatles',
    image: albumOne,
    price: '$15',
    title: 'Yellow Submarine',
  },
  {
    artist: 'Queen',
    image: albumTwo,
    price: '$22',
    title: "Don't Stop Me Now",
  },
  {
    artist: 'Michael Jackson',
    image: albumThree,
    price: '$16',
    title: 'Billie Jean',
  },
]
const mediaText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sagittis tellus ut turpis condimentum, ut dignissim lacus tincidunt. Cras dolor metus, ultrices condimentum sodales sit amet, pharetra sodales eros. Phasellus vel felis tellus. Mauris rutrum ligula nec dapibus feugiat. In vel dui laoreet, commodo augue id, pulvinar lacus.'
const mailItems = [
  {
    after: '17:14',
    subtitle: 'New messages from John Doe',
    title: 'Facebook',
  },
  {
    after: '17:11',
    subtitle: 'John Doe (@_johndoe) mentioned you on Twitter!',
    title: 'John Doe (via Twitter)',
  },
  {
    after: '16:48',
    subtitle: 'New messages from John Doe',
    title: 'Facebook',
  },
  {
    after: '15:32',
    subtitle: 'John Doe (@_johndoe) mentioned you on Twitter!',
    title: 'John Doe (via Twitter)',
  },
]
</script>

<template>
  <AgentUiDemoPage title="List">
    <AgentBlockTitle>Simple List</AgentBlockTitle>
    <AgentList dividers>
      <AgentListItem v-for="index in 3" :key="index" :title="`Item ${index}`" />
    </AgentList>

    <AgentBlockTitle>Strong List</AgentBlockTitle>
    <AgentList dividers strong>
      <AgentListItem v-for="index in 3" :key="index" :title="`Item ${index}`" />
    </AgentList>

    <AgentBlockTitle>Strong Outline List</AgentBlockTitle>
    <AgentList dividers outline strong>
      <AgentListItem v-for="index in 3" :key="index" :title="`Item ${index}`" />
    </AgentList>

    <AgentBlockTitle>Strong Inset List</AgentBlockTitle>
    <AgentList dividers inset strong>
      <AgentListItem v-for="index in 3" :key="index" :title="`Item ${index}`" />
    </AgentList>

    <AgentBlockTitle>Strong Outline Inset List</AgentBlockTitle>
    <AgentList dividers inset outline strong>
      <AgentListItem v-for="index in 3" :key="index" :title="`Item ${index}`" />
    </AgentList>

    <AgentBlockTitle>Strong List with Dividers</AgentBlockTitle>
    <AgentList dividers strong>
      <AgentListItem v-for="index in 3" :key="index" :title="`Item ${index}`" />
    </AgentList>

    <AgentBlockTitle>Simple Links List</AgentBlockTitle>
    <AgentList outline strong>
      <AgentListItem
        v-for="index in 3"
        :key="index"
        link
        :title="`Link ${index}`"
      />
    </AgentList>

    <AgentBlockTitle>Data list, with icons</AgentBlockTitle>
    <AgentList outline strong>
      <AgentListItem
        v-for="(person, index) in people"
        :key="person"
        :after="index === 0 ? 'CEO' : undefined"
        :title="person"
      >
        <template #media>
          <img class="agent-ui-demo-list__person-icon" :src="demoIcon" alt="" />
        </template>
        <template v-if="index === 1" #after
          ><AgentBadge tone="info">5</AgentBadge></template
        >
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>Links</AgentBlockTitle>
    <AgentList outline strong>
      <AgentListItem
        v-for="(person, index) in people"
        :key="person"
        :after="index === 0 ? 'CEO' : index === 1 ? 'Cleaner' : undefined"
        link
        :title="person"
      >
        <template #media>
          <img class="agent-ui-demo-list__person-icon" :src="demoIcon" alt="" />
        </template>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>Links, Header, Footer</AgentBlockTitle>
    <AgentList outline strong>
      <AgentListItem after="Edit" header="Name" link title="John Doe">
        <template #media>
          <img class="agent-ui-demo-list__person-icon" :src="demoIcon" alt="" />
        </template>
      </AgentListItem>
      <AgentListItem after="Edit" header="Phone" link title="+7 90 111-22-3344">
        <template #media>
          <img class="agent-ui-demo-list__person-icon" :src="demoIcon" alt="" />
        </template>
      </AgentListItem>
      <AgentListItem
        after="Edit"
        footer="Home"
        header="Email"
        link
        title="john@doe"
      >
        <template #media>
          <img class="agent-ui-demo-list__person-icon" :src="demoIcon" alt="" />
        </template>
      </AgentListItem>
      <AgentListItem
        after="Edit"
        footer="Work"
        header="Email"
        link
        title="john@konsta"
      >
        <template #media>
          <img class="agent-ui-demo-list__person-icon" :src="demoIcon" alt="" />
        </template>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>Links, no icons</AgentBlockTitle>
    <AgentList outline strong>
      <AgentListItem link title="Ivan Petrov" />
      <AgentListItem link title="John Doe" />
      <AgentListItem group-title title="Group title Here" />
      <AgentListItem link title="Ivan Petrov" />
      <AgentListItem link title="Jenna Smith" />
    </AgentList>

    <AgentBlockTitle>Grouped with sticky titles</AgentBlockTitle>
    <AgentList outline strong>
      <AgentListGroup v-for="group in alphabetGroups" :key="group.letter">
        <AgentListItem
          class="agent-ui-demo-list__sticky-title"
          group-title
          :title="group.letter"
        />
        <AgentListItem v-for="name in group.names" :key="name" :title="name" />
      </AgentListGroup>
    </AgentList>

    <AgentBlockTitle class="agent-ui-demo-list__media-title" large>
      Media Lists
    </AgentBlockTitle>
    <AgentBlock>
      <p class="agent-ui-demo-copy">
        Media Lists are almost the same as Data Lists, but with a more flexible
        layout for visualization of more complex data, like products, services,
        user, etc.
      </p>
    </AgentBlock>

    <AgentBlockTitle>Songs</AgentBlockTitle>
    <AgentList outline strong>
      <AgentListItem
        v-for="song in songs"
        :key="song.title"
        :after="song.price"
        link
        :subtitle="song.artist"
        :text="mediaText"
        :title="song.title"
      >
        <template #media>
          <img class="agent-ui-demo-list__album" :src="song.image" alt="" />
        </template>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>Mail App</AgentBlockTitle>
    <AgentList outline strong>
      <AgentListItem
        v-for="mail in mailItems"
        :key="`${mail.title}-${mail.after}`"
        :after="mail.after"
        link
        :subtitle="mail.subtitle"
        :text="mediaText"
        :title="mail.title"
      />
    </AgentList>
  </AgentUiDemoPage>
</template>

<style scoped>
.agent-ui-demo-list__person-icon {
  width: 28px;
  height: 28px;
  display: block;
  flex: none;
  object-fit: cover;
}

.agent-ui-demo-list__album {
  width: 80px;
  height: 80px;
  display: block;
  flex: none;
  border-radius: 8px;
  object-fit: cover;
}

.agent-ui-demo-list__media-title {
  font-size: 24px;
}

.agent-ui-demo-list__sticky-title {
  position: sticky;
  z-index: 2;
  top: 0;
}
</style>
