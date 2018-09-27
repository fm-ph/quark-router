import Promise from 'promise'
import Signal from 'quark-signal'
import pathToRegexp from 'path-to-regexp'
import find from 'lodash.find'
import merge from 'lodash.merge'
import {
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory
} from 'history'

import {
  addLeadingSlash,
  stripTrailingSlash,
  stripSlashes,
  isString,
  getHashPath,
  generateSpaces,
  supportsBrowserHistory,
  supportsScrollRestoration,
  startsWith
} from './utils'

const logStyles = 'background: #FF925E; color: #FFFFFF; padding: 3px 5px;'

/**
 * Router class.
 *
 * @class
 *
 * @license {@link https://opensource.org/licenses/MIT|MIT}
 *
 * @author Patrick Heng & Fabien Motte
 *         <hengpatrick.pro@gmail.com / contact@fabienmotte.com>
 *
 * @example
 * const routes = [{
 *   name: 'home',
 *   callback: route => { },
 *   path: '/'
 * }]
 * const router = new Router({ routes })
 */
class Router {
  /**
   * Browser mode.
   * @type {String}
   * @static
   */
  static BROWSER_MODE = 'browser'

  /**
   * Hash mode.
   * @type {String}
   * @static
   */
  static HASH_MODE = 'hash'

  /**
   * Memory mode.
   * @type {String}
   * @static
   */
  static MEMORY_MODE = 'memory'

  /**
   * Push action.
   * @type {String}
   * @static
   */
  static PUSH_ACTION = 'push'

  /**
   * Replace action.
   * @type {String}
   * @static
   */
  static REPLACE_ACTION = 'replace'

  /**
   * Pop action.
   * @type {String}
   * @static
   */
  static POP_ACTION = 'pop'

  /**
   * Creates an instance of Router.
   * @constructor
   *
   * @param {Object} [options={}] Options.
   * @param {Array} [options.routes=[]] Routes.
   * @param {String} options.routes.name Route name.
   * @param {String} options.routes.path Route path.
   * @param {Function} [options.routes.callback] Route callback.
   * @param {String} [options.routes.component] Route component.
   * @param {Object} [options.components={}] Components.
   * @param {String} [options.basePath='/'] Base path.
   * @param {String} [options.mode=Router.BROWSER_MODE] History mode.
   * @param {String} [options.locale=''] Locale.
   * @param {Boolean} [options.preRendered=false] Pre-rendered.
   * @param {Boolean} [options.restoreScroll=false] Restore scroll.
   * @param {Boolean} [options.debugMode=false] Debug mode.
   */
  constructor ({
    routes = [],
    components = {},
    basePath = '/',
    mode = Router.BROWSER_MODE,
    locale = '',
    preRendered = false,
    restoreScroll = false,
    debugMode = false
  } = {}) {
    this.routes = routes
    this.components = components
    this.basePath = stripTrailingSlash(basePath)
    this.mode = mode
    this.locale = stripSlashes(locale)
    this.preRendered = preRendered
    this.restoreScroll = restoreScroll
    this.debugMode = debugMode

    this.history = null
    this.routeData = []
    this.action = Router.REPLACE_ACTION
    this.lastRoute = null
    this.currentRoute = null
    this.pageInstance = null
    this.isFirstRoute = true

    this.routeChanged = new Signal()
    this.beforeEachChanged = new Signal()
    this.afterEachChanged = new Signal()

    this._mountEl = null

    this._createHistory()
    this._bind()
    this._parseRoutes()
    this._parseAnchors()
  }

  /**
   * Mount.
   *
   * @param {String|HTMLElement} el DOM element to mount the router on.
   */
  mount (el) {
    this._mountEl = (typeof el === 'string') ? document.querySelector(el) : el
    this._firstRoute()
  }

  /**
   * Navigate.
   *
   * @param {String|Object} [options={}] Path or options.
   * @param {String} [options.query] Route query.
   * @param {String} [options.hash] Route hash.
   * @param {String} [options.name] Route name.
   * @param {Boolean} [options.silent] Silent (replace instead of push).
   * @param {Object} [options.params] Route parameters.
   */
  navigate (options = {}) {
    let path = isString(options) ? options : options.path
    let match = null

    const query = options.query || null
    const hash = options.hash || null
    const name = options.name || null
    const silent = options.silent || false
    const params = options.params || null
    const localePrefix = this.locale ? addLeadingSlash(this.locale) : ''

    // Try to find route path by name first
    if (name !== null) {
      path = this._matchRouteByName(name).path
    }

    // If no path property found
    if (path === null) {
      console.error('Router.navigate : Cannot get route path')
      return
    }

    // Clean path and find route by path
    path = this._cleanPath(path)
    match = this._match(path)

    // If no match
    if (match === null) {
      console.error(`Router.navigate : No matching route found ` +
        `with path : '${path}'`)
      return
    }

    let newRoute = match.route
    const callback = match.callback
    const component = match.component

    // Merge options.params with matched route params
    if (params && typeof params === 'object') {
      newRoute.params = merge(newRoute.params, params)
    }

    // Merge query and hash
    newRoute = merge(newRoute, {
      query, hash
    })

    // If same route, cancel navigate
    if (this._isRouteEqual(this.currentRoute, newRoute)) {
      return
    }

    // If no callback and component is found, cancel navigate
    if (typeof callback !== 'function' && typeof component !== 'function') {
      if (this.debugMode) {
        console.log('%cRouter.navigate', logStyles, 'Cancel because ' +
          'no callback or component found')
      }
      return
    }

    // Before promise (before each hook)
    const beforePromise = new Promise((resolve, reject) => {
      if (typeof this.beforeEach === 'function') {
        this.beforeEach(this.lastRoute, newRoute, resolve)
        this.beforeEachChanged.dispatch(this.lastRoute, newRoute, resolve)
      } else {
        resolve(true) // By default, resolve if before hook does not exist
      }
    })

    beforePromise.then((resolved = true) => {
      // If next promise resolved truthly otherwise, cancel navigate
      if (resolved) {
        this.currentRoute = newRoute

        const locationObj = {
          pathname: `${localePrefix}${path}`,
          search: query,
          hash,
          state: newRoute
        }

        // If silent == true replace locationObj instead of pushing it
        if (silent === true) {
          this.action = Router.REPLACE_ACTION
          this.history.replace(locationObj)
        } else {
          this.action = Router.PUSH_ACTION
          this.history.push(locationObj)
        }

        // Instanciate component
        if (typeof component === 'function') {
          const pageInstance = new component() // eslint-disable-line
          this.currentRoute.instance = pageInstance
        }

        // After each hook
        const afterPromise = new Promise((resolve, reject) => {
          if (typeof this.afterEach === 'function') {
            this.afterEach(this.lastRoute, this.currentRoute, resolve)
            this.afterEachChanged.dispatch(
              this.lastRoute, this.currentRoute,
              resolve
            )
          } else {
            resolve(true)
          }
        })

        afterPromise.then((resolved = true) => {
          if (resolved) {
            // Call callback
            if (typeof callback === 'function') {
              callback.call(this, this.currentRoute)
            }

            // Mount component
            if (typeof component === 'function') {
              this.pageInstance = this.currentRoute.instance
              if (this.preRendered && this.isFirstRoute) {
                this.pageInstance.$preRenderMount(
                  this._mountEl.firstElementChild
                )
              } else {
                this.pageInstance.$mount(this._mountEl, 'append')
              }
            }

            this._parseAnchors()

            if (this.lastRoute === null) {
              this.isFirstRoute = false
              this.lastRoute = newRoute
            } else {
              this.lastRoute = this.currentRoute
            }
          } else if (this.debugMode) {
            console.log('%cRouter.hooks', logStyles, 'afterEach stopped ' +
              'route change')
          }
        })
      } else if (this.debugMode) {
        console.log('%cRouter.hooks', logStyles, 'beforeEach stopped ' +
          'route change')
      }
    })
      .catch(error => console.log('%cRouter.hooks', logStyles, error))
  }

  /**
   * Go to the given history entry.
   *
   * @param {Number} n Index history entry.
   */
  go (n) {
    this.history.go(n)
  }

  /**
   * Go to the previous history entry.
   */
  back () {
    this.history.goBack()
  }

  /**
   * Go to the next history entry.
   */
  forward () {
    this.history.goForward()
  }

  /**
   * Replace the current history entry.
   *
   * @param {Object} [options={}] Options.
   */
  replace (options = {}) {
    options.silent = true
    this.navigate(options)
  }

  /**
   * Before each hook.
   *
   * @param {Object} from From route.
   * @param {Object} to To route.
   * @param {Function} next Next callback.
   */
  beforeEach (from, to, next) {
    if (from && from.instance) {
      from.instance.$destroy()
    }
    next()
  }

  /**
   * After each hook.
   *
   * @param {Object} from From route.
   * @param {Object} to To route.
   * @param {Function} next Next callback.
   */
  afterEach (from, to, next) {
    next()
  }

  /**
   * Create history.
   * @private
   */
  _createHistory () {
    const keyLength = 6
    const options = {
      basename: this.basePath
    }

    if (this.debugMode) {
      console.log('%cRouter', logStyles, `Browser history mode : ${this.mode}`)
    }

    if (
      supportsBrowserHistory() === true &&
      this.mode === Router.BROWSER_MODE // Browser mode (HTML5 API)
    ) {
      this.history = createBrowserHistory({
        keyLength,
        ...options
      })
    } else if (this.mode === Router.HASH_MODE) { // Hash mode (fallback)
      this.history = createHashHistory({
        hashType: 'slash', // window.location.hash = #/test
        ...options
      })
    } else if (this.mode === Router.MEMORY_MODE) { // Memory mode
      this.history = createMemoryHistory({
        keyLength
      })
    } else {
      console.error(`Router : Unknown history browser mode : '${this.mode}'`)
    }

    // Scroll restoration
    if (supportsScrollRestoration) {
      window.history.scrollRestoration = this.restoreScroll ? 'auto' : 'manual'
    }
  }

  /**
   * Bind listeners.
   * @private
   */
  _bind () {
    this._anchorLink = this._anchorLink.bind(this)
    this._handleListen = this._handleListen.bind(this)
    this._handleHashChange = this._handleHashChange.bind(this)

    if (this.mode === Router.HASH_MODE) {
      window.addEventListener('hashchange', this._handleHashChange, false)
    } else {
      this.unlisten = this.history.listen(this._handleListen)
    }
  }

  /**
   * Unbind listeners.
   * @private
   */
  _unbind () {
    if (this.mode === Router.HASH_MODE) {
      window.removeEventListener('hashchange', this._handleHashChange, false)
    } else if (typeof this.unlisten === 'function') {
      this.unlisten()
    }
  }

  /**
   * Handle listen.
   * @private
   *
   * @param {Object} location Location.
   * @param {String} action Action.
   */
  _handleListen (location, action) {
    action = action.toLowerCase()

    if (action === Router.POP_ACTION) {
      const { path, query, hash } = location.state

      this.replace({
        path,
        query,
        hash
      })
    }

    this._dispatchRouteChange()
  }

  /**
   * Handle hash change.
   * @private
   *
   * @param {Object} [urls={}] Urls.
   * @param {String} [urls.oldURL=window.location.hash] Old url.
   * @param {String} [urls.newURL=window.location.hash] New url.
   */
  _handleHashChange ({
    oldURL = window.location.hash,
    newURL = window.location.hash
  } = {}) {
    // Do not dispatch if hash is not present in url
    if (getHashPath(oldURL).length === 0) {
      return
    }

    if (this.action === Router.POP_ACTION) {
      const { path, query, hash } = this._match(getHashPath(newURL)).route

      this.replace({
        path,
        query,
        hash
      })
    }

    this.lastRoute = this._match(getHashPath(oldURL)).route
    this.currentRoute = this._match(getHashPath(newURL)).route

    this._dispatchRouteChange()
  }

  /**
   * Dispatch a route change.
   * @private
   */
  _dispatchRouteChange () {
    this.routeChanged.dispatch(this.lastRoute, this.currentRoute)

    if (this.debugMode && this.action !== Router.POP_ACTION) {
      const log = `%cRouter.routeChange (${this.action})`
      const spaces = generateSpaces(log)

      console.log(log, logStyles, 'Last route :', this.lastRoute)
      console.log(spaces, 'Current route :', this.currentRoute)
    }

    // Pop action by default
    this.action = Router.POP_ACTION
  }

  /**
   * First route.
   * @private
   */
  _firstRoute () {
    // Get actual location object
    const { pathname, search, hash } = this.history.location

    this.navigate({
      path: pathname,
      query: search,
      hash,
      silent: true // Replace state on first route
    })

    // Dispatch hash change on first route
    if (this.mode === Router.HASH_MODE) {
      this._handleHashChange()
    }
  }

  /**
   * Parse routes.
   * @private
   */
  _parseRoutes () {
    for (let i = 0, l = this.routes.length; i < l; i++) {
      let keys = []

      this.routeData.push({
        route: this.routes[i],
        regexp: pathToRegexp(this.routes[i].path, keys),
        keys
      })
    }
  }

  /**
   * Get full path.
   * @private
   *
   * @param {Object} options Options.
   * @param {String} [options.basePath=this.basePath] Base path.
   * @param {String} [options.locale=null] Locale.
   * @param {String} [options.path=null] Path.
   * @param {String} [options.query=null] Query.
   * @param {String} [options.hash=null] Hash.
   *
   * @returns {String} Full path.
   */
  _getFullPath ({ basePath = this.basePath, locale = null, path = null,
    query = null, hash = null }) {
    basePath = basePath || ''
    locale = locale ? addLeadingSlash(locale) : ''
    path = path || ''
    query = query || ''
    hash = hash || ''

    return `${basePath}${locale}${path}${query}${hash}`
  }

  /**
   * Match route by name.
   * @private
   *
   * @param {String} name Route name.
   *
   * @returns {Object|null} Route.
   */
  _matchRouteByName (name) {
    if (typeof name === 'undefined' || !isString(name)) {
      console.error(`Router._matchRouteByName : Name argument ` +
        `is required and must be a string`)
      return
    }

    const route = find(this.routes, { name })

    if (typeof route !== 'undefined') {
      return route
    }

    return null
  }

  /**
   * Match a path.
   * @private
   *
   * @param {String} path Path.
   *
   * @returns {Object} Matched route.
   */
  _match (path) {
    if (typeof path === 'undefined' || !isString(path)) {
      console.error(`Router._match : Path argument is required ` +
        `and must be a string`)
      return
    }

    for (let i = 0, l = this.routeData.length; i < l; i++) {
      const result = this.routeData[i].regexp.exec(path)

      // If regex match, route is found
      if (result !== null) {
        const rawParams = result.splice(1)
        const params = {}

        // Parse parameters
        for (let j = 0, l = rawParams.length; j < l; j++) {
          params[this.routeData[i].keys[j].name] = rawParams[j]
        }

        let { query, hash } = this.history.location
        query = query || null
        hash = hash || null

        const { name, callback } = this.routeData[i].route
        const componentKey = this.routeData[i].route.component
        const component = this.components[componentKey]
        const routeObj = {
          name,
          path,
          params,
          query,
          hash
        }

        return {
          route: routeObj,
          component,
          callback
        }
      }
    }

    return null
  }

  /**
   * Test route equality.
   * @private
   *
   * @param {Object} currentRoute Current route.
   * @param {Object} newRoute New route.
   *
   * @returns {Boolean} True if current and new route are equals,
   *                    false otherwise.
   */
  _isRouteEqual (currentRoute, newRoute) {
    if (
      currentRoute !== null &&
      newRoute !== null &&
      currentRoute.name === newRoute.name &&
      JSON.stringify(currentRoute.params) === JSON.stringify(newRoute.params)
    ) {
      if (this.debugMode) {
        console.log('%cRouter.navigate', logStyles, 'Cancel because same route',
          newRoute)
      }

      return true
    }

    return false
  }

  /**
   * Parse anchors.
   * @private
   */
  _parseAnchors () {
    const anchorEls = document.getElementsByTagName('a')

    for (let i = 0, l = anchorEls.length; i < l; i++) {
      const anchor = anchorEls[i]

      // Get only anchor with rel attribute = internal
      if (
        typeof anchor.getAttribute === 'function' &&
        anchor.getAttribute('rel') === 'internal'
      ) {
        anchor.removeEventListener('click', this._anchorLink, false)
        anchor.addEventListener('click', this._anchorLink, false)
      }
    }
  }

  /**
   * Anchor link listener.
   * @private
   *
   * @param {Object} event Event.
   */
  _anchorLink (event) {
    event.preventDefault()

    const path = event.currentTarget.getAttribute('href')
    if (path) {
      this.navigate(addLeadingSlash(path))
    }
  }

  /**
   * Clean path.
   * @private
   *
   * @param {String} path Path.
   *
   * @returns {String} Cleaned path.
   */
  _cleanPath (path) {
    if (typeof path === 'undefined' || !isString(path)) {
      console.error(`Router._cleanPath : Path argument is required ` +
        `and must be a string`)
      return
    }

    let cleanedPath = path

    // Remove base path
    if (startsWith(cleanedPath, this.basePath)) {
      cleanedPath = cleanedPath.slice(this.basePath.length)
    }

    // Remove locale
    if (
      cleanedPath.indexOf(addLeadingSlash(this.locale)) === 0 &&
      this.locale.length !== 0
    ) {
      cleanedPath = cleanedPath.substr(this.locale.length + 1)
    }

    // Remove trailing slash
    if (cleanedPath !== '/') {
      // Remove trailing slash
      cleanedPath = stripTrailingSlash(cleanedPath)
    }

    return cleanedPath
  }
}

export default Router
