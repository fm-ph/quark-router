/**
 * Starts with.
 *
 * @param {String} str String.
 * @param {String} prefix Prefix.
 *
 * @returns {Boolean} True if given string starts with given prefix,
 *                    else otherwise.
 */
export const startsWith = (str, prefix) => str.indexOf(prefix) === 0

/**
 * Ends with.
 *
 * @param {String} str String.
 * @param {String} suffix Suffix.
 *
 * @returns {Boolean} True if given string ends with given suffix,
 *                    else otherwise.
 */
export const endsWith = (str, suffix) =>
  str.indexOf(suffix, str.length - suffix.length) >= 0

/**
 * Add leading slash.
 *
 * @param {String} str String.
 *
 * @returns {String} String with a leading slash.
 */
export const addLeadingSlash = str =>
  str.charAt(0) === '/' ? str : '/' + str

/**
 * Strip leading slash.
 *
 * @param {String} str String.
 *
 * @returns {String} String without leading slash.
 */
export const stripLeadingSlash = str => {
  if (startsWith(str, '/')) {
    return str.slice(1)
  }
  return str
}

/**
 * Strip trailing slash.
 *
 * @param {String} str String.
 *
 * @returns {String} String without trailing slash.
 */
export const stripTrailingSlash = str => {
  if (endsWith(str, '/')) {
    return str.slice(0, -1)
  }
  return str
}

/**
 * Strip slashes.
 *
 * @param {String} str String.
 *
 * @returns {String} String without slashes.
 */
export const stripSlashes = str =>
  str.replace(/\\/g, '')

/**
 * Is string.
 *
 * @param {*} val String.
 *
 * @returns {Boolean} True if it is a string, false otherwise.
 */
export const isString = val =>
  (typeof val === 'string' || val instanceof String)

/**
 * Get hash from a path.
 *
 * @param {String} href Href.
 *
 * @returns {String} Hash extracted.
 */
export const getHashPath = (href = window.location.href) => {
  const hashIndex = href.indexOf('#')
  return hashIndex === -1 ? '' : href.substring(hashIndex + 1)
}

/**
 * Generate spaces.
 *
 * @param {String} str String.
 *
 * @returns {String} Spaces corresponding to given string length.
 */
export const generateSpaces = str =>
  new Array(str.length).fill(' ').join('')

/**
 * Check browser history support.
 *
 * @returns {Boolean} True if browser history is supported, false otherwise.
 */
export const supportsBrowserHistory = () =>
  !!(
    typeof window !== 'undefined' &&
    window.history &&
    window.history.pushState
  )

/**
 * Check scroll restoration support.
 *
 * @returns {Boolean} True if scroll restoration is supported, false otherwise.
 */
export const supportsScrollRestoration = () =>
  !!(
    typeof window !== 'undefined' &&
    window.history &&
    window.history.scrollRestoration
  )
