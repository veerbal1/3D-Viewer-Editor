import React, { Component } from "react";

class Editor extends Component {
  handleChange = (e) => {
    console.log(e.target.value);
  };
  render() {
    return (
      <div id="edit-window">
        <div id="export-button-container">
          <button id="export-btn">Save</button>
        </div>
        <select name="materialName" id="material-name-selector-dropdown" ref = "cpDev1">
          &nbsp;
        </select>
        <div id="input-buttons-container">
          &nbsp;
        </div>
      </div>
    );
  }
}

export default Editor;
