// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'


const verticalMenuData = (): VerticalMenuDataType[] => [
  // This is how you will normally render submenu
  {
    label: 'dashboard',
    icon: 'ri-home-smile-line',
    suffix: {
      label: '5',
      color: 'error'
    },
    children: [
      // This is how you will normally render menu item

    ]
  },

  // This is how you will normally render menu section

  {
    label: 'Form',
    isSection: true,
    children: [
      {
        label: 'form',
        icon: 'ri-layout-4-line',
        href: '/forms/form-layouts'
      },

    ]
  }

]

export default verticalMenuData
