import sinon from 'sinon'
import Vue from 'vue'
import Vuetify from 'vuetify'
import { getVuexStore } from '@/store'
import CompositionApi from '@vue/composition-api'
import { mount, Wrapper, createLocalVue } from '@vue/test-utils'
// local
import { RegistrationConfirmation } from '@/components/dialogs'
import { dischargeConfirmationDialog, amendConfirmationDialog, renewConfirmationDialog } from '@/resources'
import { axios } from '@/utils/axios-ppr'
import { mockedDebtorNames } from './test-data'
import flushPromises from 'flush-promises'

Vue.use(Vuetify)

const vuetify = new Vuetify({})
const store = getVuexStore()

// Input field selectors / buttons
const accept: string = '#accept-btn'
const cancel: string = '#cancel-btn'
const title: string = '.dialog-title'
const dropDown: string = '#debtor-drop'

// Prevent the warning "[Vuetify] Unable to locate target [data-app]"
document.body.setAttribute('data-app', 'true')

const dischargeOptions = dischargeConfirmationDialog
const amendOptions = amendConfirmationDialog
const renewOptions = renewConfirmationDialog

describe('Registration Confirmation Dialog', () => {
  let wrapper: Wrapper<any>
  let sandbox
  sessionStorage.setItem('PPR_API_URL', 'mock-url-ppr')

  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    const get = sandbox.stub(axios, 'get')
    get.returns(
      new Promise(resolve =>
        resolve({
          data: mockedDebtorNames
        })
      )
    )
    const localVue = createLocalVue()
    localVue.use(CompositionApi)
    localVue.use(Vuetify)

    wrapper = mount(RegistrationConfirmation, {
      localVue,
      store,
      propsData: {
        attach: '',
        display: true,
        options: dischargeOptions,
        registrationNumber: '123'
      },
      vuetify
    })

    await Vue.nextTick()
  })
  afterEach(() => {
    sandbox.restore()
    wrapper.destroy()
  })

  it('renders the component and allows debtor name selection', async () => {
    await Vue.nextTick()
    await Vue.nextTick()

    expect(wrapper.findComponent(RegistrationConfirmation).exists()).toBe(true)
    expect(wrapper.isVisible()).toBe(true)
    expect(wrapper.find(title).text()).toBe(dischargeOptions.title)

    expect(wrapper.find(dropDown).exists()).toBe(true)
    expect(wrapper.find(accept).exists()).toBe(true)

    wrapper.vm.debtors = [{ text: 'Forrest Gump', value: 'Forrest Gump' },
      { text: 'Other Company', value: 'Other Company' }]

    wrapper.vm.fullDebtorInfo = mockedDebtorNames
    await flushPromises()

    const autocompleteControls = wrapper.find('.v-input__slot')
    autocompleteControls.trigger('click')

    wrapper.vm.userInput = { value: 'Forrest Gump', text: 'Forrest Gump' }

    await flushPromises()

    wrapper.find(accept).trigger('click')
    await flushPromises()

    expect(wrapper.emitted().proceed).toBeTruthy()

    expect(store.getters.getConfirmDebtorName.businessName).toBe('Forrest Gump')
  })

  it('the cancel button works', async () => {
    await Vue.nextTick()

    expect(wrapper.findComponent(RegistrationConfirmation).exists()).toBe(true)
    expect(wrapper.isVisible()).toBe(true)

    wrapper.vm.userInput = { value: 'Forrest Gump', text: 'Forrest Gump' }
    await flushPromises()

    expect(wrapper.find(cancel).exists()).toBe(true)
    wrapper.find(cancel).trigger('click')
    await flushPromises()
    expect(wrapper.emitted().confirmationClose).toBeTruthy()
    expect(wrapper.vm.userInput.value).toBe(0)
    expect(wrapper.vm.userInput.text).toBe('')
  })

  it('renders the amendment dialog', async () => {
    wrapper.setProps({ options: amendOptions })
    await Vue.nextTick()
    await Vue.nextTick()

    expect(wrapper.findComponent(RegistrationConfirmation).exists()).toBe(true)
    expect(wrapper.isVisible()).toBe(true)
    expect(wrapper.find(title).text()).toContain(amendOptions.title)
  })

  it('renders the renewal dialog', async () => {
    wrapper.setProps({ options: renewOptions })
    await Vue.nextTick()
    await Vue.nextTick()

    expect(wrapper.findComponent(RegistrationConfirmation).exists()).toBe(true)
    expect(wrapper.isVisible()).toBe(true)
    expect(wrapper.find(title).text()).toBe(renewOptions.title)
  })
})
