/**
 * mobx-binding.ts
 * binds state to pure react component
 */
import { observable, action, computed } from "mobx";
import { observer, inject, Provider, IReactComponent } from "mobx-react";



/** injects */
export function bindState<P>(name: string, component: IReactComponent<P>) {

    if ()

    return inject("appState")(observer(component)) as IReactComponent<{}>;
}


export interface AppStateProps {
    appState: AppState;
}


/** injects */
export function bindState<P>(name: string, component: IReactComponent<P>) {
    return inject("appState")(observer(component)) as IReactComponent<{}>;
}