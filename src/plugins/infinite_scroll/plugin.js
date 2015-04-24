Selectize.define('infinite_scroll', function(options) {
  var addOptionToEmptyQuery, content_height, initEnvironement, loadPage, pagination_key;
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
  if (options.isAvailableField == null) {
    options.isAvailableField = 'available';
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
  pagination_key = 0;
  addOptionToEmptyQuery = (function(_this) {
    return function(option) {
      if (_this.emptyQueryResults.indexOf(option[_this.settings.valueField] === -1)) {
        _this.cachedLoadedCount[""]++;
        return _this.emptyQueryResults.push(option[_this.settings.valueField]);
      }
    };
  })(this);
  initEnvironement = (function(_this) {
    return function() {
      var id, option, _ref, _results;
      pagination_key++;
      _this.loading = 0;
      _this.loadedSearchePages = {};
      _this.cachedScore = {};
      _this.cachedLoadedCount = {
        "": 0
      };
      _this.emptyQueryResults = [];
      _ref = _this.options;
      _results = [];
      for (id in _ref) {
        option = _ref[id];
        if (option[options.isAvailableField]) {
          _results.push(addOptionToEmptyQuery(option));
        }
      }
      return _results;
    };
  })(this);
  initEnvironement();
  this.clearPagination = (function(_this) {
    return function() {
      _this.lastQuery = null;
      initEnvironement();
      if (_this.isOpen) {
        _this.onSearchChange(_this.$control_input.val());
        return _this.refreshOptions();
      } else if (_this.settings.preload) {
        return _this.onSearchChange("");
      }
    };
  })(this);
  this.setup = (function(_this) {
    return function() {
      var original;
      original = _this.setup;
      return function() {
        original.apply(this, arguments);
        this.$autoload_on_scroll = $('<div>');
        this.$autoload_on_scroll.addClass('selectize-autoload-more');
        this.$autoload_on_scroll.text(options.loadMoreLabel);
        this.$autoload_on_scroll.hide();
        this.$dropdown_content.scroll((function(_this) {
          return function() {
            return _this.refreshAutoload();
          };
        })(this));
        this.on('dropdown_open', function() {
          this.computeContentHeight();
          return this.refreshAutoload();
        });
        this.on('load', this.refreshAutoload);
        return this.on('item_add', this.refreshAutoload);
      };
    };
  })(this)();
  loadPage = (function(_this) {
    return function(value, key) {
      _this.loadedSearchePages[value].loading = true;
      return _this.load(function(callback) {
        return options.load.call(this, value, this.loadedSearchePages[value].page, (function(_this) {
          return function(results, no_more) {
            var result, score, _base, _base1, _i, _j, _len, _len1;
            if (key !== pagination_key) {
              return;
            }
            _this.loadedSearchePages[value].loading = false;
            if (value.length) {
              if ((_base = _this.cachedLoadedCount)[value] == null) {
                _base[value] = 0;
              }
              _this.cachedLoadedCount[value] += results.length;
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
                addOptionToEmptyQuery(result);
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
  this.addOption = (function(_this) {
    return function() {
      var original;
      original = _this.addOption;
      return function(data) {
        original.call(this, data);
        if (!$.isArray(data) && data[this.settings.isAvailableField]) {
          return addOptionToEmptyQuery(data);
        }
      };
    };
  })(this)();
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
          return loadPage(value, pagination_key);
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
        return loadPage(_this.lastQuery, pagination_key);
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
        var id, out, _i, _len, _ref;
        if (query.length) {
          return original.apply(this, arguments);
        } else {
          this.sifter.items = {};
          _ref = this.emptyQueryResults;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            id = _ref[_i];
            this.sifter.items[id] = this.options[id];
          }
          out = original.apply(this, arguments);
          this.sifter.items = this.options;
          return out;
        }
      };
    };
  })(this)();
  return this.clearOptions = (function(_this) {
    return function() {
      var original;
      original = _this.clearOptions;
      return function() {
        original.apply(this, arguments);
        return initEnvironement();
      };
    };
  })(this)();
});
