<template>
  <div id="contact-info-container">
    <h2>{{ content.title }}</h2>
    <p class="mt-2">{{ content.description }}</p>

    <PartySearch
      v-if="!hidePartySearch"
      isMhrPartySearch
      @selectItem="setStoreProperty($event)"
    />

    <v-card
      id="contact-info"
      flat
      rounded
      class="mt-8 pa-8 pr-6"
      :class="{ 'border-error-left': showError }"
    >
      <v-row no-gutters>
        <v-col cols="12" sm="3">
          <label
            class="generic-label"
            :class="{ 'error-text': showError }"
          >
            {{ content.sideLabel }}
          </label>
        </v-col>
        <v-col cols="12" sm="9" class="px-1">
          <v-radio-group
            id="contact-info-type-options"
            v-model="contactInfoType"
            class="mt-0 pr-1" row
            hide-details="true"
            @change="clearFields($event)"
          >
            <v-radio
              id="person-option"
              class="person-radio"
              label="Individual Person"
              active-class="selected-radio"
              :value="SubmittingPartyTypes.PERSON"
            />
            <v-radio
              id="business-option"
              class="business-radio"
              label="Business"
              active-class="selected-radio"
              :value="SubmittingPartyTypes.BUSINESS"
            />
          </v-radio-group>

          <v-divider class="my-9 ml-0 mr-2" />

          <v-form id="contact-info-form" ref="contactInfoForm" v-model="isContactInfoFormValid">
            <!-- Person Name Input -->
            <div v-if="isPersonOption">
              <label class="generic-label" for="first-name">Person's Name</label>
              <v-row no-gutters>
                <v-col>
                  <v-text-field
                    filled
                    id="first-name"
                    class="pt-4 pr-2"
                    :class="{ 'long-error-message': enableCombinedNameValidation }"
                    label="First Name"
                    :error="hasLongCombinedName"
                    :error-messages="longCombinedNameErrorMsg"
                    v-model="contactInfoModel.personName.first"
                    :rules="isPersonOption ? firstNameRules : []"
                  />
                </v-col>
                <v-col>
                  <v-text-field
                    filled
                    id="middle-name"
                    class="pt-4 px-2"
                    label="Middle Name (Optional)"
                    :error="hasLongCombinedName"
                    :hide-details="hasLongCombinedName"
                    v-model="contactInfoModel.personName.middle"
                    :rules="isPersonOption ? middleNameRules : []"
                  />
                </v-col>
                <v-col>
                  <v-text-field
                    filled
                    id="last-name"
                    class="pt-4 px-2"
                    label="Last Name"
                    :error="hasLongCombinedName"
                    :hide-details="hasLongCombinedName"
                    v-model="contactInfoModel.personName.last"
                    :rules="isPersonOption ? lastNameRules : []"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Business Name Input -->
            <div v-if="isBusinessOption">
              <label class="generic-label" for="business-name">Business Name</label>
              <v-row no-gutters>
                <v-col>
                  <v-text-field
                    filled
                    id="business-name"
                    class="pt-4 pr-2"
                    label="Business Name"
                    v-model="contactInfoModel.businessName"
                    :rules="isBusinessOption ? businessNameRules : []"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Email Address -->
            <label class="generic-label" for="contact-info-email">Email Address</label>
            <v-text-field
              filled
              id="contact-info-email"
              class="pt-4 pr-2"
              label="Email Address (Optional)"
              v-model="contactInfoModel.emailAddress"
              :rules="emailRules"
            />

            <!-- Phone Number -->
            <label class="generic-label" for="contact-info-phone">Phone Number</label>
            <v-row no-gutters>
              <v-col>
                <v-text-field
                  v-mask="'(NNN) NNN-NNNN'"
                  filled
                  id="contact-info-phone"
                  class="pt-4 pr-3"
                  label="Phone Number (Optional)"
                  v-model="contactInfoModel.phoneNumber"
                  :rules="phoneRules"
              />
              </v-col>
              <v-col>
                <v-text-field
                  filled
                  id="contact-info-phone-ext"
                  class="pt-4 px-2"
                  label="Extension (Optional)"
                  v-model="contactInfoModel.phoneExtension"
                  :rules="phoneExtensionRules"
                />
              </v-col>
            </v-row>

            <!-- Mailing Address -->
            <article class="pt-4 pr-1">
              <label class="generic-label" for="contact-info-address">Mailing Address</label>
              <p v-if="content && content.mailAddressInfo" class="py-1">
                {{ content.mailAddressInfo }}
              </p>
              <p v-else class="py-1">
                Registry documents and decal will be mailed to this address.
              </p>

              <base-address
                editing
                hideAddressHint
                :hideDeliveryAddress="hideDeliveryAddress"
                ref="submittingPartyAddress"
                id="contact-info-address"
                :schema="PartyAddressSchema"
                :value="contactInfoModel.address"
                :triggerErrors="validate"
                @valid="isAddressValid = $event"
              />
            </article>
          </v-form>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script lang="ts">
import { useInputRules } from '@/composables'
import { SubmittingPartyTypes } from '@/enums'
import { ContentIF, FormIF, PartyIF, SubmittingPartyIF } from '@/interfaces'
import { computed, defineComponent, reactive, ref, toRefs, watch } from 'vue-demi'
import { PartyAddressSchema } from '@/schemas'
import { VueMaskDirective } from 'v-mask'
import { BaseAddress } from '@/composables/address'
import { PartySearch } from '../parties/party'

export default defineComponent({
  name: 'ContactInformation',
  emits: ['isValid'],
  components: {
    BaseAddress,
    PartySearch
  },
  props: {
    contactInfo: {
      type: Object as () => PartyIF,
      required: true
    },
    validate: {
      type: Boolean,
      default: false
    },
    content: {
      type: Object as () => ContentIF,
      default: () => {}
    },
    setStoreProperty: {
      type: Function,
      required: true
    },
    hidePartySearch: {
      type: Boolean,
      default: false
    },
    hideDeliveryAddress: {
      type: Boolean,
      default: false
    },
    enableCombinedNameValidation: {
      type: Boolean,
      default: false
    }
  },
  directives: {
    mask: VueMaskDirective
  },
  setup (props, { emit }) {
    const {
      customRules,
      invalidSpaces,
      maxLength,
      required,
      isNumber,
      isEmailOptional,
      isPhone
    } = useInputRules()

    const contactInfoForm = ref(null) as FormIF

    const localState = reactive({
      enableLookUp: true,
      contactInfoModel: computed(() => props.contactInfo as PartyIF | SubmittingPartyIF),
      contactInfoType: SubmittingPartyTypes.PERSON,
      isContactInfoFormValid: false,
      isAddressValid: false,
      hasLongCombinedName: false,
      longCombinedNameErrorMsg: computed(() =>
        localState.hasLongCombinedName ? 'Person\'s Legal Name combined cannot exceed 40 characters' : ''),
      isContactInfoValid: computed(() =>
        localState.isContactInfoFormValid && localState.isAddressValid
      ),
      isPersonOption: computed((): boolean =>
        localState.contactInfoType === SubmittingPartyTypes.PERSON
      ),
      isBusinessOption: computed((): boolean =>
        localState.contactInfoType === SubmittingPartyTypes.BUSINESS
      ),
      showError: computed(() => props.validate && !localState.isContactInfoFormValid)
    })

    watch(() => localState.contactInfoModel.businessName, (val: string) => {
      val
        ? localState.contactInfoType = SubmittingPartyTypes.BUSINESS
        : localState.contactInfoType = SubmittingPartyTypes.PERSON
    })

    watch(() => localState.contactInfoModel, (val) => {
      props.setStoreProperty(val)
    }, { deep: true, immediate: true })

    const clearFields = () => {
      if (localState.isPersonOption) {
        localState.contactInfoModel.businessName = ''
      }
      if (localState.isBusinessOption) {
        localState.contactInfoModel.personName = {
          first: '',
          middle: '',
          last: ''
        }
      }
    }

    watch(() => props.validate, async () => {
      contactInfoForm.value?.validate()
    })

    watch(() => localState.isContactInfoValid, (val: boolean) => {
      emit('isValid', val)
    })

    watch(() => localState.contactInfoModel.personName, async () => {
      localState.hasLongCombinedName =
        props.enableCombinedNameValidation &&
        (0 || localState.contactInfoModel.personName?.first.length) +
        (0 || localState.contactInfoModel.personName?.middle.length) +
        (0 || localState.contactInfoModel.personName?.last.length) > 40
    }, { deep: true })

    const firstNameRules = customRules(
      required('Enter a first name'),
      maxLength(15),
      invalidSpaces()
    )

    const emailRules = customRules(
      maxLength(250),
      isEmailOptional(),
      invalidSpaces()
    )

    const phoneRules = customRules(
      isPhone(14)
    )

    const middleNameRules = customRules(maxLength(15), invalidSpaces())

    const lastNameRules = customRules(
      required('Enter a last name'),
      maxLength(25),
      invalidSpaces())

    const businessNameRules = customRules(
      required('Business name is required'),
      maxLength(40),
      invalidSpaces()
    )

    const phoneExtensionRules = customRules(isNumber(null, null, null, 'Enter numbers only'),
      invalidSpaces(),
      maxLength(5, true)
    )

    return {
      clearFields,
      emailRules,
      firstNameRules,
      middleNameRules,
      lastNameRules,
      businessNameRules,
      phoneRules,
      phoneExtensionRules,
      SubmittingPartyTypes,
      PartyAddressSchema,
      ...toRefs(localState)
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/theme.scss';

  p {
    color: $gray7
  }
  .person-radio {
    width: 47%;
    margin-right: 20px !important;
    background-color: rgba(0, 0, 0, 0.06);
    height: 60px;
    padding: 10px;
    color: red !important
  }
  .business-radio {
    width: 50%;
    background-color: rgba(0, 0, 0, 0.06);
    height: 60px;
    padding: 10px;
    margin-right: 0px !important;
  }

  .selected-radio {
    border: 1px solid $app-blue;
    background-color: white;
    ::v-deep .theme--light.v-label:not(.v-label--is-disabled), .theme--light.v-messages {
      color: $gray9 !important;
    }
  }

  .long-error-message::v-deep .v-messages.error--text {
    position: absolute;
    width: 350px;
  }

</style>