<script setup lang="ts">
import {
  AgentBlockTitle,
  AgentCard,
  AgentLink,
  AgentList,
  AgentListItem,
  AgentMediaCard,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
import mountainsImage from '../assets/nature-1000x600-3.jpg'
import peopleImage from '../assets/people-1000x600-6.jpg'
</script>

<template>
  <AgentUiDemoPage title="Cards">
    <AgentBlockTitle>Simple Cards</AgentBlockTitle>
    <AgentCard>
      This is a simple card with plain text, but cards can also contain their
      own header, footer, list view, image, or any other element.
    </AgentCard>
    <AgentCard footer="Card footer" header="Card header">
      Card with header and footer. Card headers are used to display card titles
      and footers for additional information or just for custom actions.
    </AgentCard>
    <AgentCard>
      Another card. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Suspendisse feugiat sem est, non tincidunt ligula volutpat sit amet.
      Mauris aliquet magna justo.
    </AgentCard>

    <AgentBlockTitle>Outline Cards</AgentBlockTitle>
    <AgentCard outline>
      This is a simple card with plain text, but cards can also contain their
      own header, footer, list view, image, or any other element.
    </AgentCard>
    <AgentCard footer="Card footer" header="Card header" outline>
      Card with header and footer. Card headers are used to display card titles
      and footers for additional information or just for custom actions.
    </AgentCard>
    <AgentCard outline>
      Another card. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Suspendisse feugiat sem est, non tincidunt ligula volutpat sit amet.
      Mauris aliquet magna justo.
    </AgentCard>

    <AgentBlockTitle>Outline With Dividers</AgentBlockTitle>
    <AgentCard
      footer="Card footer"
      footer-divider
      header="Card header"
      header-divider
      outline
    >
      Card with header and footer. Card headers are used to display card titles
      and footers for additional information or just for custom actions.
    </AgentCard>

    <AgentBlockTitle>Raised Cards</AgentBlockTitle>
    <AgentCard raised>
      This is a simple card with plain text, but cards can also contain their
      own header, footer, list view, image, or any other element.
    </AgentCard>
    <AgentCard footer="Card footer" header="Card header" raised>
      Card with header and footer. Card headers are used to display card titles
      and footers for additional information or just for custom actions.
    </AgentCard>
    <AgentCard raised>
      Another card. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Suspendisse feugiat sem est, non tincidunt ligula volutpat sit amet.
      Mauris aliquet magna justo.
    </AgentCard>

    <AgentBlockTitle>Card With List View</AgentBlockTitle>
    <AgentCard :content-wrap="false">
      <AgentList flush nested>
        <AgentListItem
          v-for="index in 5"
          :key="index"
          link
          :title="`Link ${index}`"
        />
      </AgentList>
    </AgentCard>

    <AgentBlockTitle>Styled Cards</AgentBlockTitle>
    <div>
      <AgentMediaCard
        meta="Posted on January 21, 2021"
        outline
        title="Journey To Mountains"
      >
        <template #media>
          <img :src="mountainsImage" alt="" height="600" width="1000" />
        </template>
        <p>
          Quisque eget vestibulum nulla. Quisque quis dui quis ex ultricies
          efficitur vitae non felis. Phasellus quis nibh hendrerit...
        </p>
        <template #actions>
          <AgentLink>Like</AgentLink>
          <AgentLink>Read more</AgentLink>
        </template>
      </AgentMediaCard>

      <AgentMediaCard meta="Posted on January 21, 2021" title="Lorem Ipsum">
        <template #media>
          <img :src="peopleImage" alt="" height="600" width="1000" />
        </template>
        <p>
          Quisque eget vestibulum nulla. Quisque quis dui quis ex ultricies
          efficitur vitae non felis. Phasellus quis nibh hendrerit...
        </p>
        <template #actions>
          <AgentLink>Like</AgentLink>
          <AgentLink>Read more</AgentLink>
        </template>
      </AgentMediaCard>
    </div>
  </AgentUiDemoPage>
</template>
