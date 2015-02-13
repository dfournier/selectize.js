describe("infinite_scroll plugin", function() {
  var load_callback, test;
  load_callback = null;
  test = null;
  beforeEach(function(done) {
    load_callback = sinon.spy();
    test = setup_test('<input type="text">', {
      plugins: {
        infinite_scroll: {
          load: load_callback
        }
      }
    });
    return Syn.click(test.selectize.$control).type('a', test.selectize.$control_input).delay(0, done);
  });
  afterEach(function() {
    return test.selectize.destroy();
  });
  describe("first launched requests", function() {
    it("should fetch the first page", function() {
      expect(load_callback).to.have.been.calledOnce;
      expect(load_callback.firstCall.args[0]).to.equal('a');
      expect(load_callback.firstCall.args[1]).to.equal(1);
      return expect(load_callback.firstCall.args[2]).to.be.a('function');
    });
    it("should fetch the second page when the first request is done and scroll position low", function() {
      var items;
      expect(load_callback).to.have.been.calledOnce;
      items = [
        {
          value: '1',
          text: 'item1',
          score: '1'
        }
      ];
      load_callback.firstCall.args[2](items, false);
      expect(load_callback).to.have.been.calledTwice;
      expect(load_callback.secondCall.args[0]).to.equal('a');
      expect(load_callback.secondCall.args[1]).to.equal(2);
      return expect(load_callback.secondCall.args[2]).to.be.a('function');
    });
    return it("shouldn't fetch the second page when the first request is done and scroll position high", function() {
      var i, items, _i;
      expect(load_callback).to.have.been.calledOnce;
      items = [];
      for (i = _i = 1; _i <= 99; i = ++_i) {
        items.push({
          value: i.toString(),
          text: "item" + (i.toString()),
          score: 1.01 - i * 0.001
        });
      }
      load_callback.firstCall.args[2](items, false);
      return expect(load_callback).to.have.been.calledOnce;
    });
  });
  describe("loading more when scrolling", function() {
    it("should fetch the next page until callback send no_more", function() {
      var height, i, item, no_more, _i;
      for (i = _i = 1; _i <= 50; i = ++_i) {
        expect(load_callback.callCount).to.equal(i);
        expect(load_callback.lastCall.args[1]).to.equal(i);
        item = {
          value: i.toString(),
          text: "item" + (i.toString()),
          score: 1.01 - i * 0.01
        };
        no_more = i === 50;
        load_callback.lastCall.args[2]([item], no_more);
        height = test.selectize.$dropdown_content.prop('scrollHeight');
        test.selectize.$dropdown_content.scrollTop(height);
        test.selectize.$dropdown_content.trigger('scroll');
      }
      return expect(load_callback.callCount).to.equal(50);
    });
    return it("should fetch the next page until the score reach 0", function() {
      var height, i, item, _i;
      for (i = _i = 1; _i <= 50; i = ++_i) {
        expect(load_callback.callCount).to.equal(i);
        expect(load_callback.lastCall.args[1]).to.equal(i);
        item = {
          value: i.toString(),
          text: "item" + (i.toString()),
          score: i === 50 ? 0 : 1.01 - i * 0.01
        };
        load_callback.lastCall.args[2]([item], false);
        height = test.selectize.$dropdown_content.prop('scrollHeight');
        test.selectize.$dropdown_content.scrollTop(height);
        test.selectize.$dropdown_content.trigger('scroll');
      }
      return expect(load_callback.callCount).to.equal(50);
    });
  });
  describe("when typing", function() {
    return it("should not show options fetch with another query", function(done) {
      var item;
      item = {
        value: '1',
        text: "item1",
        score: 1
      };
      load_callback.getCall(0).args[2]([item], false);
      expect(load_callback).to.have.been.calledTwice;
      expect(load_callback.secondCall.args[0]).to.equal("a");
      return Syn.type('\b', test.selectize.$control_input).delay(0, function() {
        expect(load_callback).to.have.been.calledThrice;
        expect(load_callback.thirdCall.args[0]).to.equal("");
        expect(test.selectize.currentResults.total).to.equal(0);
        item = {
          value: '2',
          text: "item2",
          score: 1
        };
        load_callback.secondCall.args[2]([item], false);
        expect(test.selectize.currentResults.total).to.equal(0);
        item = {
          value: '2',
          text: "item2",
          score: 1
        };
        load_callback.thirdCall.args[2]([item], false);
        expect(test.selectize.currentResults.total).to.equal(1);
        expect(test.selectize.currentResults.items[0].id).to.equal("2");
        expect(load_callback.callCount).to.equal(4);
        return done();
      });
    });
  });
  return describe("clearPagination() method", function() {
    it("should reset the pagination counter and currentResults", function() {
      var item;
      item = {
        value: "1",
        text: "item1",
        score: 1
      };
      load_callback.lastCall.args[2]([item], false);
      test.selectize.clearPagination();
      expect(test.selectize.currentResults.total).to.equal(0);
      expect(load_callback.callCount).to.equal(3);
      expect(load_callback.lastCall.args[0]).to.equal('a');
      return expect(load_callback.lastCall.args[1]).to.equal(1);
    });
    it("should ignore late load callbacks", function() {
      var item;
      item = {
        value: "1",
        text: "item1",
        score: 1
      };
      test.selectize.clearPagination();
      load_callback.lastCall.args[2]([item], false);
      return expect(test.selectize.currentResults.total).to.equal(0);
    });
    return it("should add options with isAvailableField", function(done) {
      var items;
      items = [
        {
          value: "1",
          text: "item1",
          score: 1,
          available: true
        }, {
          value: "2",
          text: "item2",
          score: 1,
          available: false
        }, {
          value: "3",
          text: "item3",
          score: 1
        }
      ];
      load_callback.lastCall.args[2](items, false);
      test.selectize.clearPagination();
      return Syn.type('\b', test.selectize.$control_input).delay(0, function() {
        expect(test.selectize.currentResults.total).to.equal(1);
        expect(test.selectize.currentResults.items[0].id).to.equal("1");
        return done();
      });
    });
  });
});
