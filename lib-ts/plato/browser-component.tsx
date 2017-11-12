import { AppStateProps, bindState } from "./state";

export const Layout = bindState("Layout", ({ appState }: AppStateProps) => {
    return <div id="app-layout" />
});