Selectize.define 'infinite_scroll', (options) ->

  if @settings.load?
    throw new Error 'Setting "load" must be passed to "infinite_scroll" plugin'

  if @settings.score?
    throw new Error 'Setting "score" is invalid with "infinite_scroll" plugin'

  options.loadMoreLabel ?= 'Loading more results...'
  options.distanceToAutoload ?= 20
  options.scoreValueField ?= 'score'

  @settings.score = (query) ->
    fun = (item) =>
      if @cachedScore[query]?
        return @cachedScore[query][item[@settings.valueField]] || 0
      else
        return 0
    return fun

  content_height = 0

  @loadedSearchePages = {}
  @cachedScore = {}
  @emptyQueryResults = []
  @cachedLoadedCount = {}
  @cachedLoadedCount[""] = 0

  @setup = do =>
    original = @setup
    return ->
      original.apply this, arguments
      @$autoload_on_scroll = $('<div>')
      @$autoload_on_scroll.addClass('selectize-autoload-more')
      @$autoload_on_scroll.text(options.loadMoreLabel)
      @$autoload_on_scroll.hide()

      for id, option of @options
        @cachedLoadedCount[""]++
        @emptyQueryResults.push
          id    : id
          score : 1

      @$dropdown_content.scroll =>
        @refreshAutoload()
      @on 'dropdown_open', ->
        @computeContentHeight()
        @refreshAutoload()
      @on 'load', =>
        @refreshAutoload()

  loadPage = (value) =>
    @loadedSearchePages[value].loading = true
    @load (callback) -> options.load.call @, value, @loadedSearchePages[value].page, (results, no_more) =>
      @loadedSearchePages[value].loading = false
      @cachedLoadedCount[value] ?= 0
      @cachedLoadedCount[value] += results.length

      if value.length
        @cachedScore[value] ?= {}
        for result in results
          score = result[options.scoreValueField]
          @cachedScore[value][result[@settings.valueField]] = score
      else
        for result in results
          @emptyQueryResults.push
            id    : result[@settings.valueField]
            score : 1

      @updateScore = true if value is @lastQuery
      callback.apply @, arguments
      @updateScore = false

      @$autoload_on_scroll.hide()
      if no_more
        @loadedSearchePages[value].needMore = false

  @onSearchChange = do =>
    return (value) ->
      fn = options.load
      return unless fn?
      if @loadedSearchePages.hasOwnProperty(value)
        @refreshAutoload()
      else
        @loadedSearchePages[value] =
          page     : 1
          needMore : true
          loading  : false
        loadPage(value)

  @refreshAutoload = =>
    if not @lastQuery? or not @isOpen or not @loadedSearchePages[@lastQuery]? or @loadedSearchePages[@lastQuery].loading
      return
    if @loadedSearchePages[@lastQuery].needMore
      if @cachedLoadedCount[@lastQuery] isnt @currentResults.total
        @loadedSearchePages[@lastQuery].needMore = false
        return
    else
      return
    distance_to_reach_bottom = content_height - @$dropdown_content.scrollTop()

    if distance_to_reach_bottom < options.distanceToAutoload
      @$autoload_on_scroll.show()

      @loadedSearchePages[@lastQuery].page++
      loadPage(@lastQuery)

  @computeContentHeight = =>
    $el = @$dropdown_content
    content_height = $el.prop('scrollHeight') - $el.height()

  @refreshOptions = do =>
    original = @refreshOptions
    return ->
      original.apply this, arguments
      @$dropdown_content.append @$autoload_on_scroll
      @computeContentHeight()

  @search = do =>
    original = @search
    return (query) ->
      if query.length
        original.apply this, arguments
      else
        @lastQuery = ""
        @currentResults =
          items : @emptyQueryResults
          total : @cachedLoadedCount[""]
          query : ""

  @clearOptions = do =>
    original = @clearOptions
    return ->
      original.apply this, arguments
