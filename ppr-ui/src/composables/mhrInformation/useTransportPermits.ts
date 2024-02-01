import { computed, ComputedRef, nextTick, ref, Ref } from 'vue'
import { createDateFromPacificTime, deleteEmptyProperties, getFeatureFlag, submitMhrTransportPermit } from '@/utils'
import { useStore } from '@/store/store'
import { storeToRefs } from 'pinia'
import { locationChangeTypes } from '@/resources/mhr-transport-permits/transport-permits'
import { LocationChangeTypes } from '@/enums/transportPermits'
import { MhrRegistrationHomeLocationIF, MhrTransportPermitIF, StaffPaymentIF } from '@/interfaces'
import { APIRegistrationTypes, UnitNoteDocTypes } from '@/enums'
import { cloneDeep } from 'lodash'

// Global constants
const isChangeLocationActive: Ref<boolean> = ref(false)

export const useTransportPermits = () => {
  const { isRoleStaffReg,
    isRoleQualifiedSupplier,
    getLienRegistrationType,
    getMhrUnitNotes,
    getMhrTransportPermit
  } = storeToRefs(useStore())

  const {
    setMhrTransportPermit,
    setEmptyMhrTransportPermit,
    setUnsavedChanges,
    setMhrTransportPermitLocationChangeType
  } = useStore()

  /** Returns true when staff or qualified supplier and the feature flag is enabled **/
  const isChangeLocationEnabled: ComputedRef<boolean> = computed((): boolean => {
    return (isRoleStaffReg.value || isRoleQualifiedSupplier.value) && getFeatureFlag('mhr-transport-permit-enabled')
  })

  /** Toggle location change flow **/
  const setLocationChange = (val: boolean) => {
    isChangeLocationActive.value = val
  }

  const setLocationChangeType = (locationChangeType: LocationChangeTypes) => {
    setMhrTransportPermitLocationChangeType(locationChangeType)
  }

  const getUiLocationType = (locationChangeType: LocationChangeTypes): string => {
    return locationChangeTypes.find(item => item.type === locationChangeType)?.title
  }

  const getUiFeeSummaryLocationType = (locationChangeType: LocationChangeTypes): string => {
    return locationChangeTypes.find(item => item.type === locationChangeType)?.feeSummaryTitle
  }

  // For Transport Permits within same park, copy the reg summary info to the transport permit
  const populateLocationInfoForSamePark = (locationInfo: MhrRegistrationHomeLocationIF) => {
    setMhrTransportPermit({ key: 'newLocation', value: cloneDeep(locationInfo) })
  }

  const isTransportPermitDisabledQS = computed((): boolean =>
    // QS role check
    isRoleQualifiedSupplier.value &&
    // PPR Liens check
    [APIRegistrationTypes.LAND_TAX_LIEN,
    APIRegistrationTypes.MAINTENANCE_LIEN,
    APIRegistrationTypes.MANUFACTURED_HOME_NOTICE]
      .includes(getLienRegistrationType.value as APIRegistrationTypes) &&
    // Unit Notes check
    getMhrUnitNotes.value
      .map(note => note.documentType)
      .some(note => [
        UnitNoteDocTypes.NOTICE_OF_TAX_SALE,
        UnitNoteDocTypes.CONFIDENTIAL_NOTE,
        UnitNoteDocTypes.RESTRAINING_ORDER]
        .includes(note))
  )

  const resetTransportPermit = async (shouldResetLocationChange: boolean = false): Promise<void> => {
    setEmptyMhrTransportPermit(initTransportPermit())
    shouldResetLocationChange && setLocationChange(false)
    setUnsavedChanges(false)
    await nextTick()
  }

  const buildAndSubmitTransportPermit = (mhrNumber: string, staffPayment: StaffPaymentIF) => {
    return submitMhrTransportPermit(mhrNumber, buildPayload(), staffPayment)
  }

  const buildPayload = (): MhrTransportPermitIF => {
    const payloadData: MhrTransportPermitIF = cloneDeep(getMhrTransportPermit.value)
    deleteEmptyProperties(payloadData)

    // only regular Transport Permit has Tax Certificate date
    if (getMhrTransportPermit.value.locationChangeType === LocationChangeTypes.TRANSPORT_PERMIT) {

      const yearMonthDay = payloadData.newLocation.taxExpiryDate.split('-')
      const year = parseInt(yearMonthDay[0])
      const month = parseInt(yearMonthDay[1]) - 1
      const day = parseInt(yearMonthDay[2])

      payloadData.newLocation.taxExpiryDate = createDateFromPacificTime(year, month, day, 0, 1)
        .toISOString()
        .replace('.000Z', '+00:00')

      payloadData.newLocation.address.postalCode = ' '
    }

    return payloadData
  }

  const initTransportPermit = (): MhrTransportPermitIF => {
    return {
      documentId: '',
      submittingParty: {
        personName: {
          first: '',
          last: '',
          middle: ''
        },
        businessName: '',
        address: {
          street: '',
          streetAdditional: '',
          city: '',
          region: '',
          country: '',
          postalCode: ''
        },
        emailAddress: '',
        phoneNumber: '',
        phoneExtension: ''
      },
      locationChangeType: null,
      newLocation: {
        parkName: '',
        pad: '',
        address: {
          street: '',
          streetAdditional: '',
          city: '',
          region: null,
          country: null,
          postalCode: ''
        },
        leaveProvince: false,
        pidNumber: '',
        taxCertificate: false,
        taxExpiryDate: '',
        dealerName: '',
        additionalDescription: '',
        locationType: null,
        otherType: null,
        legalDescription: '',
        lot: '',
        parcel: '',
        block: '',
        districtLot: '',
        partOf: '',
        section: '',
        township: '',
        range: '',
        meridian: '',
        landDistrict: '',
        plan: '',
        bandName: '',
        reserveNumber: '',
        exceptionPlan: ''
      } as MhrRegistrationHomeLocationIF,
      ownLand: null
    }
  }

  return {
    initTransportPermit,
    resetTransportPermit,
    isChangeLocationActive,
    isChangeLocationEnabled,
    isTransportPermitDisabledQS,
    setLocationChange,
    setLocationChangeType,
    getUiLocationType,
    getUiFeeSummaryLocationType,
    populateLocationInfoForSamePark,
    buildAndSubmitTransportPermit
  }
}
