<template>
  <v-container flat class="pa-0" id="certify-summary">

    <v-row no-gutters>
      <v-col class="generic-label"><h2>2. Authorization</h2></v-col>
    </v-row>
    <v-row no-gutters class="pb-6 pt-4">
      <v-col>
        {{ infoText }}
      </v-col>
    </v-row>
    <v-row no-gutters class="mb-5 party-summary">
      <v-col>
        <v-data-table
          class="party-summary-table"
          :headers="authorizedHeaders"
          :items="registeringParty"
          disable-pagination
          disable-sort
          hide-default-footer
          no-data-text=""
        >
          <template v-slot:item="row" class="party-data-table">
            <tr :key="row.item.id" class="party-row">
              <td class="list-item__title title-text" style="padding-left:30px">
                <v-row no-gutters>
                  <v-col cols="3">
                    <div class="icon-div mt-n1 pr-4">
                      <v-icon>mdi-account</v-icon>
                    </div>
                  </v-col>
                  <v-col cols="9">
                    <div>
                      {{ legalName }}
                    </div>
                  </v-col>
                </v-row>
              </td>
              <td>{{ row.item.businessName }}</td>
              <td>
                <base-address
                  :editing="false"
                  :schema="DefaultSchema"
                  :value="row.item.address"
                />
              </td>
              <td>{{ row.item.emailAddress }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-row class="no-gutters">
      <v-col cols="12" class="pa-0" :class="showErrorComponent ? 'border-error-left': ''">
        <v-card flat>
          <v-row no-gutters style="padding: 0 30px;">
            <v-col cols="3" class="generic-label pt-8">
              <span :class="showErrorComponent ? 'invalid-color': ''">Confirm<br/>Authorization</span>
            </v-col>
            <v-col cols="9" class="pt-8">
              <v-row no-gutters class="pa-0">
                <v-col cols="12" class="summary-text">
                  <v-checkbox
                      class="pa-0 ma-0"
                      :hide-details="true"
                      id="checkbox-certified"
                      v-model="certified">
                      <template v-slot:label>
                        <div class="pt-3">
                        <span :class="showErrorComponent ? 'invalid-color': ''">
                          I, <span class="generic-label" :class="showErrorComponent ? 'invalid-color': ''">
                                {{ legalName }}
                             </span>, have relevant knowledge of, and am authorized to submit, this registration.
                        </span>
                        </div>
                      </template>
                  </v-checkbox>
                </v-col>
              </v-row>
              <v-row no-gutters class="pt-3 pb-8">
                  <v-col cols="12" class="pl-8 ma-0">
                    <span class="generic-label">Date: </span><span class="summary-text">{{ currentDate }}</span>
                  </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  reactive,
  toRefs,
  watch,
  onMounted
} from '@vue/composition-api'
import { useGetters, useActions } from 'vuex-composition-helpers'
// local
import { convertDate, getRegisteringPartyFromAuth } from '@/utils'
import { BaseAddress } from '@/composables/address'
import { DefaultSchema } from '@/composables/address/resources'
import { BaseHeaderIF, CertifyIF } from '@/interfaces' // eslint-disable-line no-unused-vars
import { SessionStorageKeys } from 'sbc-common-components/src/util/constants'

export default defineComponent({
  components: {
    BaseAddress
  },
  props: {
    setShowErrors: {
      type: Boolean,
      default: false
    }
  },
  setup (props, { emit }) {
    const { setCertifyInformation } = useActions<any>([
      'setCertifyInformation'
    ])
    const { getCertifyInformation } = useGetters<any>([
      'getCertifyInformation'
    ])
    const authorizedTableHeaders: Array<BaseHeaderIF> = [
      {
        class: 'column-md extra-indent py-4',
        sortable: false,
        text: 'Name',
        value: 'name'
      },
      {
        class: 'column-md py-4',
        sortable: false,
        text: 'Account Name',
        value: 'legalName'
      },
      {
        class: 'column-md py-4',
        sortable: false,
        text: 'Address',
        value: 'address'
      },
      {
        class: 'column-mds py-4',
        sortable: false,
        text: 'Email Address',
        value: 'emailAddress'
      }
    ]

    const localState = reactive({
      legalName: '',
      certified: false,
      infoText: 'The following account information will be recorded by BC Registries upon registration and payment. ' +
                'This information is used to confirm you have the authority to submit this registration and will ' +
                'not appear on the verification statement.',
      showErrors: computed((): boolean => {
        return props.setShowErrors
      }),
      showErrorComponent: computed((): boolean => {
        return (localState.showErrors && !localState.valid)
      }),
      authorizedHeaders: computed(function () {
        const headersToShow = [...authorizedTableHeaders]
        return headersToShow
      }),
      certifyInformation: null,
      registeringParty: [],
      currentDate: computed((): string => {
        return convertDate(new Date(), false, false)
      }),
      valid: computed((): boolean => {
        return localState.certified
      })
    })

    watch(
      () => localState.certified,
      (val: boolean) => {
        emit('certifyValid', localState.valid)
        localState.certifyInformation.certified = val
        localState.certifyInformation.valid = localState.valid
        setCertifyInformation(localState.certifyInformation)
      }
    )

    onMounted(async () => {
      const certifyInfo:CertifyIF = getCertifyInformation.value
      let update:boolean = false
      if (!certifyInfo.registeringParty) {
        update = true
        const regParty = await getRegisteringPartyFromAuth()
        if (regParty) {
          certifyInfo.registeringParty = regParty
        }
      }
      if (!certifyInfo.legalName) {
        update = true
        try {
          const token = sessionStorage.getItem(SessionStorageKeys.KeyCloakToken)
          const decodedToken = JSON.parse(atob(token.split('.')[1]))
          certifyInfo.legalName = decodedToken.firstname + ' ' + decodedToken.lastname
        } catch (e) {
          console.error(e)
        }
      }
      if (update) {
        setCertifyInformation(certifyInfo)
      }
      localState.certifyInformation = certifyInfo
      if (localState.certifyInformation.registeringParty) {
        localState.registeringParty = [localState.certifyInformation.registeringParty]
      }
      localState.registeringParty = [certifyInfo.registeringParty]
      localState.legalName = localState.certifyInformation.legalName
      localState.certified = localState.certifyInformation.certified
    })

    return {
      ...toRefs(localState),
      DefaultSchema
    }
  }
})
</script>

<style lang="scss" module>
@import '@/assets/styles/theme.scss';
</style>