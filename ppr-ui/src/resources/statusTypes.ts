import { APIStatusTypes, UIStatusTypes } from '@/enums'

export const StatusTypes: Array<any> = [
  {
    value: APIStatusTypes.DRAFT,
    text: UIStatusTypes.DRAFT
  },
  {
    value: APIStatusTypes.ACTIVE,
    text: UIStatusTypes.ACTIVE
  }
]