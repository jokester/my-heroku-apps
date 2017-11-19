/**
 * UI of Prato
 */
import * as React from "react";
import { AppStateProps, bindState } from "./state";
import { ChatEntry } from "./messages";

export const PlatoApp = bindState("PlatoApp", ({ appState }: AppStateProps) => {
    return <p>hi</p>;
});