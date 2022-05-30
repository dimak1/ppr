// Libraries
import Vue from 'vue'
import Vuetify from 'vuetify'
import VueRouter from 'vue-router'
import { getVuexStore } from '@/store'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import sinon from 'sinon'
import { axios } from '@/utils/axios-ppr'
import {
  mockedFinancingStatementAll,
  mockedDebtorNames,
  mockedAmendmentResponse,
  mockedAmendmentCertified,
  mockedDraftAmendmentStatement,
  mockedVehicleCollateral1,
  mockedGeneralCollateral1,
  mockedPartyCodeSearchResults
} from './test-data'

// Components
import { ConfirmAmendment } from '@/views'
import { CertifyInformation, FolioNumberSummary, StickyContainer } from '@/components/common'
import { BaseDialog, StaffPaymentDialog } from '@/components/dialogs'
import { AmendmentDescription, RegistrationLengthTrustAmendment } from '@/components/registration'
import { GenColSummary } from '@/components/collateral/generalCollateral'

// Other
import mockRouter from './MockRouter'
import { ActionTypes, RouteNames } from '@/enums'
import { StateModelIF } from '@/interfaces'
import flushPromises from 'flush-promises'
import { FeeSummaryTypes } from '@/composables/fees/enums'
import { RegisteringPartyChange } from '@/components/parties/party'

Vue.use(Vuetify)

const vuetify = new Vuetify({})
const store = getVuexStore()

// Prevent the warning "[Vuetify] Unable to locate target [data-app]"
document.body.setAttribute('data-app', 'true')

describe('Confirm Amendment registration component', () => {
  let wrapper: any
  let sandbox
  const { assign } = window.location
  sessionStorage.setItem('KEYCLOAK_TOKEN', 'token')

  beforeEach(async () => {
    // mock the window.location.assign function
    delete window.location
    window.location = { assign: jest.fn() } as any
    // store setup
    await store.dispatch('setRegistrationConfirmDebtorName', mockedDebtorNames[0])
    // stub api call
    sandbox = sinon.createSandbox()
    const get = sandbox.stub(axios, 'get')
    get.returns(new Promise(resolve => resolve({
      data: { ...mockedFinancingStatementAll }
    })))

    const post = sandbox.stub(axios, 'post')
    post.returns(new Promise(resolve => resolve({
      data: { ...mockedDraftAmendmentStatement }
    })))

    await store.dispatch('setLengthTrust', {
      valid: true,
      trustIndenture: false,
      lifeInfinite: false,
      lifeYears: 5,
      showInvalid: false,
      surrenderDate: '',
      lienAmount: '',
      action: ActionTypes.EDITED
    })
    await store.dispatch('setOriginalLengthTrust', {
      valid: true,
      trustIndenture: true,
      lifeInfinite: false,
      lifeYears: 5,
      showInvalid: false,
      surrenderDate: '',
      lienAmount: ''
    })
    await store.dispatch('setAmendmentDescription', 'test')
    await store.dispatch('setGeneralCollateral', [{ descriptionAdd: 'test', descriptionDelete: 'othertest' }])

    // create a Local Vue and install router on it
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = mockRouter.mock()
    await router.push({
      name: RouteNames.CONFIRM_AMENDMENT,
      query: { 'reg-num': '123456B' }
    })
    wrapper = shallowMount(ConfirmAmendment, { localVue, store, router, vuetify })
    wrapper.setProps({ appReady: true })
    await flushPromises()
  })

  afterEach(() => {
    window.location.assign = assign
    wrapper.destroy()
    sandbox.restore()
  })

  it('renders Review Confirm View with child components', () => {
    expect(wrapper.vm.$route.name).toBe(RouteNames.CONFIRM_AMENDMENT)
    expect(wrapper.vm.appReady).toBe(true)
    expect(wrapper.vm.dataLoaded).toBe(true)
    const state = wrapper.vm.$store.state.stateModel as StateModelIF

    expect(wrapper.findComponent(ConfirmAmendment).exists()).toBe(true)
    expect(wrapper.findComponent(FolioNumberSummary).exists()).toBe(true)
    expect(wrapper.findComponent(CertifyInformation).exists()).toBe(true)
    expect(wrapper.findComponent(GenColSummary).exists()).toBe(true)

    // check registering party
    expect(state.registration.parties.registeringParty).toBe(null)
    expect(wrapper.findComponent(RegisteringPartyChange).exists()).toBe(true)
    expect(wrapper.findComponent(RegistrationLengthTrustAmendment).exists()).toBe(true)
    expect(wrapper.findComponent(AmendmentDescription).exists()).toBe(true)
    // check fee summary + buttons
    expect(wrapper.findComponent(StickyContainer).exists()).toBe(true)
    expect(wrapper.findComponent(StickyContainer).vm.$props.setShowFeeSummary).toBe(true)
    expect(wrapper.findComponent(StickyContainer).vm.$props.setShowButtons).toBe(true)
    expect(wrapper.findComponent(StickyContainer).vm.$props.setBackBtn).toBe('Back')
    expect(wrapper.findComponent(StickyContainer).vm.$props.setCancelBtn).toBe('Cancel')
    expect(wrapper.findComponent(StickyContainer).vm.$props.setSubmitBtn).toBe('Register Amendment and Pay')
    expect(wrapper.findComponent(StickyContainer).vm.$props.setFeeType).toBe(FeeSummaryTypes.AMEND)
    expect(wrapper.findComponent(StickyContainer).vm.$props.setErrMsg).toBe('')
    // dialog
    expect(wrapper.findComponent(BaseDialog).exists()).toBe(true)
    expect(wrapper.findComponent(StaffPaymentDialog).exists()).toBe(true)
  })

  it('allows back to amend page', async () => {
    expect(wrapper.findComponent(ConfirmAmendment).exists()).toBe(true)
    await wrapper.findComponent(StickyContainer).vm.$emit('back', true)
    await Vue.nextTick()
    await flushPromises()
    expect(wrapper.vm.$route.name).toBe(RouteNames.AMEND_REGISTRATION)
  })

  it('navigate to amend registration', async () => {
    expect(wrapper.findComponent(ConfirmAmendment).exists()).toBe(true)
    await wrapper.findComponent(StickyContainer).vm.$emit('back', true)
    wrapper.vm.goToReviewAmendment()
    await Vue.nextTick()
    expect(wrapper.vm.$route.name).toBe(RouteNames.AMEND_REGISTRATION)
  })

  it('processes cancel button action', async () => {
    // setup
    await wrapper.vm.$store.dispatch('setUnsavedChanges', true)
    // dialog doesn't start visible
    expect(wrapper.findComponent(BaseDialog).vm.$props.setDisplay).toBe(false)
    // pressing cancel triggers dialog
    await wrapper.findComponent(StickyContainer).vm.$emit('cancel', true)
    expect(wrapper.findComponent(BaseDialog).vm.$props.setDisplay).toBe(true)
    // if dialog emits proceed false it closes + stays on page
    await wrapper.findComponent(BaseDialog).vm.$emit('proceed', true)
    expect(wrapper.findComponent(BaseDialog).vm.$props.setDisplay).toBe(false)
    expect(wrapper.vm.$route.name).toBe(RouteNames.CONFIRM_AMENDMENT)
    // if dialog emits proceed true it goes to dashboard
    await wrapper.findComponent(StickyContainer).vm.$emit('cancel', true)
    await wrapper.findComponent(BaseDialog).vm.$emit('proceed', false)
    expect(wrapper.findComponent(BaseDialog).vm.$props.setDisplay).toBe(false)
    expect(wrapper.vm.$route.name).toBe(RouteNames.DASHBOARD)
  })
})

describe('Confirm Amendment registration save registration', () => {
  let wrapper: any
  let sandbox
  const { assign } = window.location
  sessionStorage.setItem('KEYCLOAK_TOKEN', 'token')

  beforeEach(async () => {
    // mock the window.location.assign function
    delete window.location
    window.location = { assign: jest.fn() } as any
    // store setup
    await store.dispatch('setRegistrationConfirmDebtorName', mockedDebtorNames[0])
    // stub api call
    sandbox = sinon.createSandbox()
    const get = sandbox.stub(axios, 'get')
    get.returns(new Promise(resolve => resolve({
      data: { ...mockedFinancingStatementAll }
    })))
    const post = sandbox.stub(axios, 'post')
    post.returns(new Promise(resolve => resolve({
      data: { ...mockedAmendmentResponse }
    })))

    await store.dispatch('setLengthTrust', {
      valid: true,
      trustIndenture: false,
      lifeInfinite: false,
      lifeYears: 5,
      showInvalid: false,
      surrenderDate: '',
      lienAmount: '',
      action: ActionTypes.EDITED
    })
    await store.dispatch('setOriginalLengthTrust', {
      valid: true,
      trustIndenture: true,
      lifeInfinite: false,
      lifeYears: 5,
      showInvalid: false,
      surrenderDate: '',
      lienAmount: ''
    })
    await store.dispatch('setAddCollateral', {
      vehicleCollateral: mockedVehicleCollateral1,
      generalCollateral: mockedGeneralCollateral1,
      valid: true
    })
    await store.dispatch('setAmendmentDescription', 'test')
    await store.dispatch('setCertifyInformation', mockedAmendmentCertified)

    // create a Local Vue and install router on it
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = mockRouter.mock()
    await router.push({
      name: RouteNames.CONFIRM_AMENDMENT,
      query: { 'reg-num': '123456B' }
    })
    wrapper = shallowMount(ConfirmAmendment, { localVue, store, router, vuetify })
    wrapper.setProps({ appReady: true })
    await flushPromises()
  })

  afterEach(() => {
    window.location.assign = assign
    wrapper.destroy()
    sandbox.restore()
  })

  it('allows submit of amendment', async () => {
    // Set up for valid amendment request
    await store.dispatch('setRegistrationNumber', '023001B')
    await store.dispatch('setFolioOrReferenceNumber', 'A-00000402')
    await store.dispatch('setRegistrationConfirmDebtorName', mockedDebtorNames[0])
    const state = wrapper.vm.$store.state.stateModel as StateModelIF
    const parties = state.registration.parties
    parties.registeringParty = mockedPartyCodeSearchResults[0]
    await store.dispatch('setAddSecuredPartiesAndDebtors', parties)
    expect(wrapper.vm.collateralValid).toBe(true)
    expect(wrapper.vm.partiesValid).toBe(true)
    expect(wrapper.vm.courtOrderValid).toBe(true)

    await wrapper.findComponent(StickyContainer).vm.$emit('submit', true)
    await flushPromises()
    expect(wrapper.vm.$route.name).toBe(RouteNames.DASHBOARD)
    // new amend registration is in store regTableData
    expect(wrapper.vm.$store.state.stateModel.registrationTable.newItem.addedReg)
      .toBe(mockedAmendmentResponse.amendmentRegistrationNumber)
    expect(wrapper.vm.$store.state.stateModel.registrationTable.newItem.addedRegParent)
      .toBe(mockedAmendmentResponse.baseRegistrationNumber)
  })
})

describe('Confirm Amendment for staff', () => {
  let wrapper: any
  let sandbox
  const { assign } = window.location
  sessionStorage.setItem('KEYCLOAK_TOKEN', 'token')

  beforeEach(async () => {
    // mock the window.location.assign function
    delete window.location
    window.location = { assign: jest.fn() } as any
    // store setup
    await store.dispatch('setRegistrationConfirmDebtorName', mockedDebtorNames[0])
    await store.dispatch('setAuthRoles', ['staff', 'ppr_staff'])
    // stub api call
    sandbox = sinon.createSandbox()
    const get = sandbox.stub(axios, 'get')
    get.returns(new Promise(resolve => resolve({
      data: { ...mockedFinancingStatementAll }
    })))
    const post = sandbox.stub(axios, 'post')
    post.returns(new Promise(resolve => resolve({
      data: { ...mockedAmendmentResponse }
    })))

    await store.dispatch('setLengthTrust', {
      valid: true,
      trustIndenture: false,
      lifeInfinite: false,
      lifeYears: 5,
      showInvalid: false,
      surrenderDate: '',
      lienAmount: '',
      action: ActionTypes.EDITED
    })
    await store.dispatch('setOriginalLengthTrust', {
      valid: true,
      trustIndenture: true,
      lifeInfinite: false,
      lifeYears: 5,
      showInvalid: false,
      surrenderDate: '',
      lienAmount: ''
    })
    await store.dispatch('setAddCollateral', {
      vehicleCollateral: mockedVehicleCollateral1,
      generalCollateral: mockedGeneralCollateral1,
      valid: true
    })
    await store.dispatch('setAmendmentDescription', 'test')
    await store.dispatch('setCertifyInformation', mockedAmendmentCertified)

    // create a Local Vue and install router on it
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = mockRouter.mock()
    await router.push({
      name: RouteNames.CONFIRM_AMENDMENT,
      query: { 'reg-num': '123456B' }
    })
    wrapper = shallowMount(ConfirmAmendment, { localVue, store, router, vuetify })
    wrapper.setProps({ appReady: true })
    await flushPromises()
  })

  afterEach(() => {
    window.location.assign = assign
    wrapper.destroy()
    sandbox.restore()
  })

  it('shows staff payment', async () => {
    // Set up for valid amendment request
    await store.dispatch('setRegistrationNumber', '023001B')
    await store.dispatch('setFolioOrReferenceNumber', 'A-00000402')
    await store.dispatch('setRegistrationConfirmDebtorName', mockedDebtorNames[0])
    expect(wrapper.vm.collateralValid).toBe(true)
    expect(wrapper.vm.partiesValid).toBe(true)
    expect(wrapper.vm.courtOrderValid).toBe(true)
    // need to wait 2 secs so throttle is done
    setTimeout(async () => {
      await wrapper.findComponent(StickyContainer).vm.$emit('submit', true)
      await flushPromises()
      expect(wrapper.findComponent(StaffPaymentDialog).vm.$props.setDisplay).toBe(true)
    }, 2000)
  })
})
