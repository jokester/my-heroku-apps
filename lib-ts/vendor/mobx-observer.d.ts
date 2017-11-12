declare module "mobx-observer" {
    import * as preact from "preact";
    export function observer<C extends preact.Component<any, any>>(constructor: C);
}
