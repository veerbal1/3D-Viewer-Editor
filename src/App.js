import React, { Component } from "react";
import { hot } from "react-hot-loader";

import Viewer from "./viewer_copy";

import "./App.css";
import Editor from "./Editor";
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="App">
        <Viewer></Viewer>
      </div>
    );
  }
}

export default hot(module)(App);
