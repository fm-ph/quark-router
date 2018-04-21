import { Component } from 'quark-component'

class Home extends Component {
  constructor () {
    super({
      name: 'home'
    })
  }

  get template () {
    return `<div id="home">HOME <a href="/example" rel="internal">EXAMPLE</a></div>`
  }

  get components () {

  }
}

export default Home
