<script setup lang="ts">
import { ref } from 'vue'

import { AgentBlock, AgentButton, AgentLink, AgentToolbar, AgentToolbarPane } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const isTop = ref(false)
</script>

<template>
  <AgentUiDemoPage title="Toolbar" :with-tabbar="!isTop">
    <AgentToolbar
      v-if="isTop"
      aria-label="Top toolbar example"
      class="agent-ui-demo-toolbar agent-ui-demo-toolbar--top"
      component="nav"
      top
    >
      <AgentToolbarPane>
        <AgentLink>Link 1</AgentLink>
        <AgentLink>Link 2</AgentLink>
      </AgentToolbarPane>
      <AgentToolbarPane><AgentLink>Link 3</AgentLink></AgentToolbarPane>
    </AgentToolbar>

    <AgentBlock class="agent-ui-demo-stack" inset strong>
      <p class="agent-ui-demo-copy">
        Toolbar supports both top and bottom positions. Click the following
        button to change its position.
      </p>
      <AgentButton rounded @click="isTop = !isTop">
        Toggle Toolbar Position
      </AgentButton>
    </AgentBlock>
    <AgentBlock class="agent-ui-demo-stack" inset strong>
      <p class="agent-ui-demo-copy">
        Mauris fermentum neque et luctus venenatis. Vivamus a sem rhoncus,
        ornare tellus eu, euismod mauris. In porta turpis at semper convallis.
        Duis adipiscing leo eu nulla lacinia, quis rhoncus metus condimentum.
        Etiam nec malesuada nibh. Maecenas quis lacinia nisl, vel posuere dolor.
        Vestibulum condimentum, nisl ac vulputate egestas, neque enim dignissim
        elit, rhoncus volutpat magna enim a est. Aenean sit amet ligula neque.
        Cras suscipit rutrum enim. Nam a odio facilisis, elementum tellus non,
        tortor. Pellentesque felis eros, dictum vitae lacinia quis, lobortis
        vitae ipsum. Cras vehicula bibendum lorem quis imperdiet.
      </p>
      <p class="agent-ui-demo-copy">
        In hac habitasse platea dictumst. Etiam varius, ante vel ornare
        facilisis, velit massa rutrum dolor, ac porta magna magna lacinia nunc.
        Curabitur cursus laoreet. Aenean vel tempus augue. Pellentesque in
        imperdiet nibh. Mauris rhoncus nulla id sem suscipit volutpat.
        Pellentesque ac arcu in nisi viverra pulvinar. Nullam nulla orci,
        bibendum sed ligula non, ullamcorper iaculis mi. In hac habitasse platea
        dictumst. Praesent varius at nisl eu luctus. Cras aliquet porta est.
        Quisque elementum quis dui et consectetur. Cum sociis natoque penatibus
        et magnis dis parturient montes, nascetur ridiculus mus. Sed sed laoreet
        purus. Pellentesque eget ante ante.
      </p>
      <p class="agent-ui-demo-copy">
        Duis et ultricies nibh. Sed facilisis turpis urna, ac imperdiet erat
        venenatis eu. Proin sit amet faucibus tortor, et varius sem. Etiam vitae
        lacinia neque. Aliquam nisi purus, interdum in arcu sed, ultrices rutrum
        arcu. Nulla mi turpis, consectetur vel enim quis, facilisis viverra dui.
        Aliquam quis convallis tortor, quis semper ligula. Morbi ullamcorper
        massa at accumsan. Etiam purus odio, posuere in ligula vitae, viverra
        ultricies justo. Vestibulum nec interdum nisi. Aenean ac consectetur
        velit, non malesuada magna. Sed pharetra vehicula augue, vel venenatis
        lectus gravida eget. Curabitur lacus tellus, venenatis eu arcu in,
        interdum auctor nunc. Nunc non metus neque. Suspendisse viverra lectus
        sed risus aliquet, vel accumsan dolor feugiat.
      </p>
    </AgentBlock>

    <template #fixed>
      <AgentToolbar
        v-if="!isTop"
        aria-label="Bottom toolbar example"
        class="agent-ui-demo-toolbar agent-ui-demo-toolbar--bottom"
        component="nav"
      >
        <AgentToolbarPane>
          <AgentLink>Link 1</AgentLink>
          <AgentLink>Link 2</AgentLink>
        </AgentToolbarPane>
        <AgentToolbarPane><AgentLink>Link 3</AgentLink></AgentToolbarPane>
      </AgentToolbar>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.agent-ui-demo-toolbar--top {
  position: sticky;
  top: 0;
}

.agent-ui-demo-toolbar--bottom {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
