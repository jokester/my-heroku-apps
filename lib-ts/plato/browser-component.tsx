import { AppStateProps,  } from "./state";
import { observer, setComponent } from "mobx-observer";

export const Layout = bindState("Layout", ({ appState }: AppStateProps) => {
    return <div id="app-layout" />
});