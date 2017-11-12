declare module "mobx-observer" {
    import * as preact from "preact";
    export function observer<C extends preact.Component<any, any>>(constructor: C): C;
    export function setComponent<C extends preact.Component<any, any>>(constructor: C): void;
    export function makeObserver<C extends preact.Component<any, {}>>(constructor: C): C;
}
