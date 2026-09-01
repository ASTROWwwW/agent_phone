<script setup lang="ts">
import {
  AgentBlock,
  AgentBlockTitle,
  AgentCard,
  AgentTable,
  AgentTableBody,
  AgentTableCell,
  AgentTableHead,
  AgentTableRow,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const desserts = [
  {
    calories: 159,
    carbs: 24,
    fat: '6.0',
    name: 'Frozen yogurt',
    protein: '4.0',
  },
  {
    calories: 237,
    carbs: 37,
    fat: '9.0',
    name: 'Ice cream sandwich',
    protein: '4.4',
  },
  { calories: 262, carbs: 24, fat: '16.0', name: 'Eclair', protein: '6.0' },
  { calories: 305, carbs: 67, fat: '3.7', name: 'Cupcake', protein: '4.3' },
]
</script>

<template>
  <AgentUiDemoPage title="Data Table">
    <AgentBlockTitle>Plain table</AgentBlockTitle>
    <AgentBlock class="data-table-demo__scroll">
      <AgentTable aria-label="Dessert nutrition plain table">
        <AgentTableHead>
          <AgentTableRow header>
            <AgentTableCell header nowrap scope="col">
              Dessert (100g serving)
            </AgentTableCell>
            <AgentTableCell align="end" header nowrap scope="col">
              Calories
            </AgentTableCell>
            <AgentTableCell align="end" header nowrap scope="col">
              Fat (g)
            </AgentTableCell>
            <AgentTableCell align="end" header nowrap scope="col">
              Carbs
            </AgentTableCell>
            <AgentTableCell align="end" header nowrap scope="col">
              Protein (g)
            </AgentTableCell>
          </AgentTableRow>
        </AgentTableHead>
        <AgentTableBody>
          <AgentTableRow v-for="dessert in desserts" :key="dessert.name">
            <AgentTableCell nowrap>{{ dessert.name }}</AgentTableCell>
            <AgentTableCell numeric>{{ dessert.calories }}</AgentTableCell>
            <AgentTableCell numeric>{{ dessert.fat }}</AgentTableCell>
            <AgentTableCell numeric>{{ dessert.carbs }}</AgentTableCell>
            <AgentTableCell numeric>{{ dessert.protein }}</AgentTableCell>
          </AgentTableRow>
        </AgentTableBody>
      </AgentTable>
    </AgentBlock>

    <AgentBlockTitle>Within card</AgentBlockTitle>
    <AgentCard class="data-table-demo__scroll" :content-wrap="false">
      <AgentTable aria-label="Dessert nutrition card table">
        <AgentTableHead>
          <AgentTableRow header>
            <AgentTableCell header nowrap scope="col">
              Dessert (100g serving)
            </AgentTableCell>
            <AgentTableCell align="end" header nowrap scope="col">
              Calories
            </AgentTableCell>
            <AgentTableCell align="end" header nowrap scope="col">
              Fat (g)
            </AgentTableCell>
            <AgentTableCell align="end" header nowrap scope="col">
              Carbs
            </AgentTableCell>
            <AgentTableCell align="end" header nowrap scope="col">
              Protein (g)
            </AgentTableCell>
          </AgentTableRow>
        </AgentTableHead>
        <AgentTableBody>
          <AgentTableRow v-for="dessert in desserts" :key="dessert.name">
            <AgentTableCell nowrap>{{ dessert.name }}</AgentTableCell>
            <AgentTableCell numeric>{{ dessert.calories }}</AgentTableCell>
            <AgentTableCell numeric>{{ dessert.fat }}</AgentTableCell>
            <AgentTableCell numeric>{{ dessert.carbs }}</AgentTableCell>
            <AgentTableCell numeric>{{ dessert.protein }}</AgentTableCell>
          </AgentTableRow>
        </AgentTableBody>
      </AgentTable>
    </AgentCard>
  </AgentUiDemoPage>
</template>

<style scoped>
.data-table-demo__scroll {
  overflow-x: auto;
}

.data-table-demo__scroll :deep(.agent-table) {
  min-width: 520px;
}
</style>
