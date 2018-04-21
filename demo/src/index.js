import Router from 'quark-router'

import Home from './Home'
import Example from './Example'

const routes = [{
  name: 'home',
  component: 'Home',
  path: '/'
}, {
  name: 'example',
  component: 'Example',
  path: '/example'
}]

window.addEventListener('DOMContentLoaded', () => {
  const router = new Router({
    routes,
    components: {
      Home,
      Example
    },
    debugMode: true
  })

  router.mount('.router-view')

  window.Router = router
})
