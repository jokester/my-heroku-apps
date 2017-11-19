/**
 * Plato: a multi-user chat webapp
 *
 *  (browser entrypoint)
 */

import { webpack_dev, haveHMR, } from "./browser/webpack-hmr";
import * as ReactDOM from "react-dom";
import * as React from "react";

import { useStrict as mobxUseStrict, autorunAsync } from "mobx";
import { Provider } from "mobx-react";

import { PlatoApp } from "./plato/browser";
import { AppState } from "./plato/state";

mobxUseStrict(true);

if (webpack_dev && haveHMR(module)) {
    // dev w/ HMR: hot-reload root app
    console.info("configuring webpack HMR");
    module.hot.accept("./browser", function () {
        console.log("accept handler get called", [].slice.call(arguments));
        renderRoot();
    });
} else if (webpack_dev) {
    // dev w/o HMR
    console.info("webpack HMR not available");
} /* else do nothing in production */

const appState = new AppState();

renderRoot();

function renderRoot() {
    ReactDOM.render(
        <Provider appState={appState} >
            <PlatoApp />
        </Provider>,
        document.querySelector("#react-render-root"));
}