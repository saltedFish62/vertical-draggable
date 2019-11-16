import list from './data'

Page({
  data: {
    list: []
  },

  onReady() {
    this.setData({ list })
  }
})