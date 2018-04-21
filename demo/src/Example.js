import { Component } from 'quark-component'

class Example extends Component {
  constructor () {
    super({
      name: 'example'
    })
  }

  get template () {
    return `<div id="example"><a href="/" rel="internal">HOME</a> EXAMPLE</div>`
  }

  get components () {

  }
}

export default Example
