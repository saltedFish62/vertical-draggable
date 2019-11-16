Component({
  properties: {
    list: {
      type: Object,
      value: [],
      observer: "observerList"
    },

    gap: {
      type: Number,
      value: 15,
    }
  },

  externalClasses: ['draggable-class'],

  data: {
    nodeIdPosMap: {},

    totalHeight: 0,
    draggingId: '',
    draggingNodeY: 0,
    draggingOffset: 0,
    yOffset: 0,
  },

  lifetimes: {
    attached() {
    }
  },

  methods: {
    /**
     * 监听列表变化
     * @param {Array} list 
     */
    observerList(list) {
      if (list.length < 1) {
        return;
      }

      this.initNodesPos(list)
    },

    /**
     * 更新节点的位置
     */
    initNodesPos(list) {
      this.createSelectorQuery()
        .selectAll('.draggable-node-content')
        .boundingClientRect()
        .exec(res => {
          const nodes = res[0]
          const nodeIdPosMap = {}

          let totalHeight = 0
          for (let i = 0; i < list.length; i++) {
            const id = list[i].id
            const node = nodes.find(it => it.id === id)
            nodeIdPosMap[id] = {
              y: totalHeight,
              height: node.height,
              sort: i
            }
            totalHeight += node.height + this.data.gap
          }
          this.setData({ nodeIdPosMap, totalHeight })
        })
    },

    /**
     * 处理节点长按
     * @param {Object} e 
     */
    async handleNodeLongPress(e) {
      const id = e.currentTarget.id

      this.data.yOffset = Math.abs((await this.getAreaPos()).top)
      const touchY = e.touches[0].clientY
      const nodeY = (await this.getNodePos(id)).top
      const draggingOffset = touchY - nodeY
      const draggingNodeY = this.data.nodeIdPosMap[id].y

      this.setData({
        draggingId: id,
        draggingOffset,
        draggingNodeY,
      })
    },

    /**
     * 获取 Draggable area 的顶部高度
     */
    getAreaPos() {
      return new Promise(resolve => {
        this.createSelectorQuery()
          .select('.draggable')
          .boundingClientRect()
          .exec(res => {
            resolve(res[0])
          })
      })
    },

    /**
     * 获取节点的位置信息
     * @param {String} id 
     */
    getNodePos(id) {
      return new Promise(resolve => {
        this.createSelectorQuery()
          .select(`#${id}`)
          .boundingClientRect()
          .exec(res => {
            resolve(res[0])
          })
      })
    },

    /**
     * 移动
     * @param {Object} e 
     */
    handleNodeTouchMove(e) {
      const id = e.currentTarget.id
      const top = e.touches[0].clientY
      const targetY = this.data.yOffset + top - this.data.draggingOffset
      this.setData({
        draggingNodeY: targetY
      })

      const idPosMap = this.data.nodeIdPosMap
      const currentSort = idPosMap[id].sort

      let preNodeId = ''
      let nxtNodeId = ''
      for (let key in idPosMap) {
        if (idPosMap[key].sort === currentSort - 1) {
          preNodeId = key
        }
        if (idPosMap[key].sort === currentSort + 1) {
          nxtNodeId = key
        }
      }
      if (preNodeId && this.needWrap(idPosMap[preNodeId], idPosMap[id])) {
        this.swapNode(preNodeId, id)
      }
      if (nxtNodeId && this.needWrap(idPosMap[nxtNodeId], idPosMap[id])) {
        this.swapNode(nxtNodeId, id)
      }
    },

    /**
     * 换位
     * @param {String} passiveId 
     * @param {String} activeId 
     */
    swapNode(passiveId, activeId) {
      const map = this.data.nodeIdPosMap
      console.log(passiveId, activeId)

      // swap y
      if (map[passiveId].sort > map[activeId].sort) {
        // 若被动的节点在下方
        map[passiveId].y = map[activeId].y
        map[activeId].y = map[passiveId].y + map[passiveId].height + this.data.gap
      } else {
        map[activeId].y = map[passiveId].y
        map[passiveId].y = map[activeId].y + map[activeId].height + this.data.gap
      }

      // swap sort
      const tempSort = map[passiveId].sort
      map[passiveId].sort = map[activeId].sort
      map[activeId].sort = tempSort

      this.setData({
        [`nodeIdPosMap.${passiveId}`]: map[passiveId],
        [`nodeIdPosMap.${activeId}`]: map[activeId],
      })
    },

    /**
     * 判断是否需要换位
     * @param {Object} passiveNode - 被动的节点
     * @param {Object} activeNode - 主动的节点，即拖拽中的节点
     */
    needWrap(passiveNode, activeNode) {
      const passiveMidLine = passiveNode.y + passiveNode.height / 2
      const activeMidLine = this.data.draggingNodeY + activeNode.height / 2
      return (activeNode.sort - passiveNode.sort) * (activeMidLine - passiveMidLine) < 0
    },

    /**
     * 松手事件
     * @param {Object} e 
     */
    handleNodeTouchEnd(e) {
      console.log(e)
      this.setData({
        draggingId: ''
      })
    },
  }
})