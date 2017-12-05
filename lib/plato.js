"use strict";
/**
 * Plato: a multi-user chat webapp
 *
 *  (browser entrypoint)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_hmr_1 = require("./browser/webpack-hmr");
const ReactDOM = require("react-dom");
const React = require("react");
const mobx_1 = require("mobx");
const mobx_react_1 = require("mobx-react");
const index_1 = require("./plato/index");
mobx_1.useStrict(true);
if (webpack_hmr_1.webpack_dev && webpack_hmr_1.haveHMR(module)) {
    // dev w/ HMR: hot-reload root app
    console.info("configuring webpack HMR");
    module.hot.accept("./plato/index", function () {
        console.log("accept handler get called", [].slice.call(arguments));
        renderRoot();
    });
}
else if (webpack_hmr_1.webpack_dev) {
    // dev w/o HMR
    console.info("webpack HMR not available");
} /* else do nothing in production */
const appState = new index_1.AppState();
renderRoot();
function renderRoot() {
    ReactDOM.render(React.createElement(mobx_react_1.Provider, { appState: appState },
        React.createElement(index_1.PlatoApp, null)), document.querySelector("#react-render-root"));
}
