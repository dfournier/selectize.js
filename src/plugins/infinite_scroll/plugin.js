Selectize.define('infinite_scroll', function(options) {
  var content_height, loadPage;
  if (this.settings.load != null) {
    throw new Error('Setting "load" must be passed to "infinite_scroll" plugin');
  }
  if (this.settings.score != null) {
    throw new Error('Setting "score" is invalid with "infinite_scroll" plugin');
  }
  if (options.loadMoreLabel == null) {
    options.loadMoreLabel = 'Loading more results...';
  }
  if (options.distanceToAutoload == null) {
    options.distanceToAutoload = 20;
  }
  if (options.scoreValueField == null) {
    options.scoreValueField = 'score';
  }
  this.settings.score = function(query) {
    var fun;
    fun = (function(_this) {
      return function(item) {
        if (_this.cachedScore[query] != null) {
          return _this.cachedScore[query][item[_this.settings.valueField]] || 0;
        } else {
          return 0;
        }
      };
    })(this);
    return fun;
  };
  content_height = 0;
  this.loadedSearchePages = {};
  this.cachedScore = {};
  this.emptyQueryResults = [];
  this.cachedLoadedCount = {};
  this.cachedLoadedCount[""] = 0;
  this.setup = (function(_this) {
    return function() {
      var original;
      original = _this.setup;
      return function() {
        var id, option, _ref;
        original.apply(this, arguments);
        this.$autoload_on_scroll = $('<div>');
        this.$autoload_on_scroll.addClass('selectize-autoload-more');
        this.$autoload_on_scroll.text(options.loadMoreLabel);
        this.$autoload_on_scroll.hide();
        _ref = this.options;
        for (id in _ref) {
          option = _ref[id];
          this.cachedLoadedCount[""]++;
          this.emptyQueryResults.push({
            id: id,
            score: 1
          });
        }
        this.$dropdown_content.scroll((function(_this) {
          return function() {
            return _this.refreshAutoload();
          };
        })(this));
        this.on('dropdown_open', function() {
          this.computeContentHeight();
          return this.refreshAutoload();
        });
        return this.on('load', (function(_this) {
          return function() {
            return _this.refreshAutoload();
          };
        })(this));
      };
    };
  })(this)();
  loadPage = (function(_this) {
    return function(value) {
      _this.loadedSearchePages[value].loading = true;
      return _this.load(function(callback) {
        return options.load.call(this, value, this.loadedSearchePages[value].page, (function(_this) {
          return function(results, no_more) {
            var result, score, _base, _base1, _i, _j, _len, _len1;
            _this.loadedSearchePages[value].loading = false;
            if ((_base = _this.cachedLoadedCount)[value] == null) {
              _base[value] = 0;
            }
            _this.cachedLoadedCount[value] += results.length;
            if (value.length) {
              if ((_base1 = _this.cachedScore)[value] == null) {
                _base1[value] = {};
              }
              for (_i = 0, _len = results.length; _i < _len; _i++) {
                result = results[_i];
                score = result[options.scoreValueField];
                _this.cachedScore[value][result[_this.settings.valueField]] = score;
              }
            } else {
              for (_j = 0, _len1 = results.length; _j < _len1; _j++) {
                result = results[_j];
                _this.emptyQueryResults.push({
                  id: result[_this.settings.valueField],
                  score: 1
                });
              }
            }
            if (value === _this.lastQuery) {
              _this.updateScore = true;
            }
            callback.apply(_this, arguments);
            _this.updateScore = false;
            _this.$autoload_on_scroll.hide();
            if (no_more) {
              return _this.loadedSearchePages[value].needMore = false;
            }
          };
        })(this));
      });
    };
  })(this);
  this.onSearchChange = (function(_this) {
    return function() {
      return function(value) {
        var fn;
        fn = options.load;
        if (fn == null) {
          return;
        }
        if (this.loadedSearchePages.hasOwnProperty(value)) {
          return this.refreshAutoload();
        } else {
          this.loadedSearchePages[value] = {
            page: 1,
            needMore: true,
            loading: false
          };
          return loadPage(value);
        }
      };
    };
  })(this)();
  this.refreshAutoload = (function(_this) {
    return function() {
      var distance_to_reach_bottom;
      if ((_this.lastQuery == null) || !_this.isOpen || (_this.loadedSearchePages[_this.lastQuery] == null) || _this.loadedSearchePages[_this.lastQuery].loading) {
        return;
      }
      if (_this.loadedSearchePages[_this.lastQuery].needMore) {
        if (_this.cachedLoadedCount[_this.lastQuery] !== _this.currentResults.total) {
          _this.loadedSearchePages[_this.lastQuery].needMore = false;
          return;
        }
      } else {
        return;
      }
      distance_to_reach_bottom = content_height - _this.$dropdown_content.scrollTop();
      if (distance_to_reach_bottom < options.distanceToAutoload) {
        _this.$autoload_on_scroll.show();
        _this.loadedSearchePages[_this.lastQuery].page++;
        return loadPage(_this.lastQuery);
      }
    };
  })(this);
  this.computeContentHeight = (function(_this) {
    return function() {
      var $el;
      $el = _this.$dropdown_content;
      return content_height = $el.prop('scrollHeight') - $el.height();
    };
  })(this);
  this.refreshOptions = (function(_this) {
    return function() {
      var original;
      original = _this.refreshOptions;
      return function() {
        original.apply(this, arguments);
        this.$dropdown_content.append(this.$autoload_on_scroll);
        return this.computeContentHeight();
      };
    };
  })(this)();
  this.search = (function(_this) {
    return function() {
      var original;
      original = _this.search;
      return function(query) {
        if (query.length) {
          return original.apply(this, arguments);
        } else {
          this.lastQuery = "";
          return this.currentResults = {
            items: this.emptyQueryResults,
            total: this.cachedLoadedCount[""],
            query: ""
          };
        }
      };
    };
  })(this)();
  return this.clearOptions = (function(_this) {
    return function() {
      var original;
      original = _this.clearOptions;
      return function() {
        return original.apply(this, arguments);
      };
    };
  })(this)();
});
