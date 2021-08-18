<template>
  <v-container flat class="pa-0">
    <v-row v-if="options.header" class="summary-header pa-2 rounded-top" no-gutters>
      <v-col cols="auto" class="pa-2">
        <v-icon v-if="options.iconImage" :color="options.iconColor">{{ options.iconImage }}</v-icon>
        <label class="pl-3" :class="$style['sectionText']">
          <strong>{{ options.header }}</strong>
        </label>
      </v-col>
    </v-row>
    <v-row no-gutters class="pb-6 pt-4">
      <v-col>
        <v-data-table
          class="party-summary-table"
          :headers="headers"
          :items="items"
          disable-pagination
          disable-sort
          hide-default-footer
          no-data-text=""
        >
          <template v-slot:item="row" class="party-data-table">
            <tr :key="row.item.id" class="party-row">
              <td class="list-item__title">
                <div class="icon-div" v-if="isBusiness(row.item)">
                  <v-icon class="mt-n2 pr-4">mdi-domain</v-icon>
                </div>
                <div class="icon-div" v-else>
                  <v-icon class="mt-n2 pr-4">mdi-account</v-icon>
                </div>
                {{ getName(row.item) }}
              </td>
              <td>
                <base-address
                  :editing="false"
                  :schema="DefaultSchema"
                  :value="row.item.address"
                />
              </td>
              <td>{{ row.item.emailAddress }}</td>
              <td v-if="options.isDebtorSummary">{{ getFormattedBirthdate(row.item) }}</td>
              <td v-else>{{ row.item.code }}</td>
            </tr>
          </template>
          <template v-if="options.enableNoDataAction" slot="no-data">
            <v-icon color="error">mdi-information-outline</v-icon>
            <span class="invalid-message">
              This step is unfinished.
            </span>
            <span class="invalid-link" @click="noDataAction()">
              Return to this step to complete it.
            </span>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  toRefs
} from '@vue/composition-api'

// local
import { BaseAddress } from '@/composables/address'
import { DefaultSchema } from '@/composables/address/resources'
import { useParty } from '@/composables/useParty'
import { BaseHeaderIF, PartyIF, PartySummaryOptionsI } from '@/interfaces' // eslint-disable-line no-unused-vars

export default defineComponent({
  name: 'BasePartySummary',
  components: {
    BaseAddress
  },
  props: {
    setHeaders: {
      default: () => [] as Array<BaseHeaderIF>
    },
    setItems: {
      default: () => [] as PartyIF
    },
    setOptions: {
      default: () => {
        return {
          enableNoDataAction: false,
          header: '',
          iconColor: '',
          iconImage: '',
          isDebtorSummary: false
        } as PartySummaryOptionsI
      }
    }
  },
  emits: ['triggerNoDataAction'],
  setup (props, { emit }) {
    const localState = reactive({
      headers: props.setHeaders,
      items: props.setItems,
      options: props.setOptions
    })
    const noDataAction = (): void => {
      emit('triggerNoDataAction', true)
    }
    const { getFormattedBirthdate, getName, isBusiness } = useParty()

    return {
      ...toRefs(localState),
      getFormattedBirthdate,
      getName,
      isBusiness,
      noDataAction,
      DefaultSchema
    }
  }
})
</script>

<style lang="scss" module>
@import '@/assets/styles/theme.scss';
.sectionText {
  color: $gray9;
}
</style>