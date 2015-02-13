describe "infinite_scroll plugin", ->
  load_callback = null
  test          = null

  beforeEach (done) ->
    load_callback = sinon.spy()
    test = setup_test '<input type="text">',
      plugins:
        infinite_scroll:
          load: load_callback
    Syn
    .click(test.selectize.$control)
    .type('a', test.selectize.$control_input)
    .delay(0, done)

  afterEach ->
      test.selectize.destroy()

  describe "first launched requests", ->
    it "should fetch the first page", ->
      expect(load_callback).to.have.been.calledOnce
      expect(load_callback.firstCall.args[0]).to.equal 'a'
      expect(load_callback.firstCall.args[1]).to.equal 1
      expect(load_callback.firstCall.args[2]).to.be.a 'function'

    it "should fetch the second page when the first request is done and scroll position low", ->
      expect(load_callback).to.have.been.calledOnce
      items = [
          {
            value : '1'
            text  : 'item1'
            score : '1'
          }
        ]
      load_callback.firstCall.args[2](items, false)
      expect(load_callback).to.have.been.calledTwice
      expect(load_callback.secondCall.args[0]).to.equal 'a'
      expect(load_callback.secondCall.args[1]).to.equal 2
      expect(load_callback.secondCall.args[2]).to.be.a 'function'

    it "shouldn't fetch the second page when the first request is done and scroll position high", ->
      expect(load_callback).to.have.been.calledOnce
      items = []
      for i in [1..99]
        items.push
          value : i.toString()
          text  : "item#{i.toString()}"
          score : 1.01 - i*0.001
      load_callback.firstCall.args[2](items, false)
      expect(load_callback).to.have.been.calledOnce

  describe "loading more when scrolling", ->
    it "should fetch the next page until callback send no_more", ->
      for i in [1..50]
        expect(load_callback.callCount).to.equal i
        expect(load_callback.lastCall.args[1]).to.equal i
        item =
          value : i.toString()
          text  : "item#{i.toString()}"
          score : 1.01 - i*0.01
        no_more = i is 50
        load_callback.lastCall.args[2]([item], no_more)
        height = test.selectize.$dropdown_content.prop('scrollHeight')
        test.selectize.$dropdown_content.scrollTop height
        test.selectize.$dropdown_content.trigger('scroll')
       expect(load_callback.callCount).to.equal 50

    it "should fetch the next page until the score reach 0", ->
      for i in [1..50]
        expect(load_callback.callCount).to.equal i
        expect(load_callback.lastCall.args[1]).to.equal i
        item =
          value : i.toString()
          text  : "item#{i.toString()}"
          score : if i is 50 then 0 else 1.01 - i*0.01
        load_callback.lastCall.args[2]([item], false)
        height = test.selectize.$dropdown_content.prop('scrollHeight')
        test.selectize.$dropdown_content.scrollTop height
        test.selectize.$dropdown_content.trigger('scroll')

       expect(load_callback.callCount).to.equal 50

  describe "when typing", ->
    it "should not show options fetch with another query", (done) ->
      item =
        value : '1'
        text  : "item1"
        score : 1
      load_callback.getCall(0).args[2]([item], false)
      expect(load_callback).to.have.been.calledTwice
      expect(load_callback.secondCall.args[0]).to.equal "a"
      Syn.type('\b', test.selectize.$control_input)
      .delay 0, ->
        expect(load_callback).to.have.been.calledThrice
        expect(load_callback.thirdCall.args[0]).to.equal ""
        expect(test.selectize.currentResults.total).to.equal 0

        item =
          value : '2'
          text  : "item2"
          score : 1
        load_callback.secondCall.args[2]([item], false)
        expect(test.selectize.currentResults.total).to.equal 0

        item =
          value : '2'
          text  : "item2"
          score : 1
        load_callback.thirdCall.args[2]([item], false)
        expect(test.selectize.currentResults.total).to.equal 1
        expect(test.selectize.currentResults.items[0].id).to.equal "2"
        expect(load_callback.callCount).to.equal 4
        done()

  describe "clearPagination() method", ->
    it "should reset the pagination counter and currentResults", ->
      item =
        value : "1"
        text  : "item1"
        score : 1
      load_callback.lastCall.args[2]([item], false)
      test.selectize.clearPagination()
      expect(test.selectize.currentResults.total).to.equal 0
      expect(load_callback.callCount).to.equal 3
      expect(load_callback.lastCall.args[0]).to.equal 'a'
      expect(load_callback.lastCall.args[1]).to.equal 1

    it "should ignore late load callbacks", ->
      item =
        value : "1"
        text  : "item1"
        score : 1
      test.selectize.clearPagination()
      load_callback.lastCall.args[2]([item], false)
      expect(test.selectize.currentResults.total).to.equal 0

    it "should add options with isAvailableField", (done) ->
      items = [
        {
          value     : "1"
          text      : "item1"
          score     : 1
          available : true
        }
        {
          value : "2"
          text  : "item2"
          score : 1
          available : false
        }
        {
          value : "3"
          text  : "item3"
          score : 1
        }
      ]
      load_callback.lastCall.args[2](items, false)
      test.selectize.clearPagination()
      Syn.type('\b', test.selectize.$control_input).delay 0, ->
        expect(test.selectize.currentResults.total).to.equal 1
        expect(test.selectize.currentResults.items[0].id).to.equal "1"
        done()
