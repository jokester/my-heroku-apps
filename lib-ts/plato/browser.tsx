/**
 * UI of Prato
 * largely taken from tbekolay/preact-mdl-example
 * @see https://github.com/tbekolay/preact-mdl-example/blob/master/src/main.tsx
 */
// TODO: load from cdn
require("material-design-lite");

import { React } from "../browser";

import {
    Button, Card, Icon,
    Layout, Navigation, TextField, LayoutHeader
} from "preact-mdl";

import { PlatoConnection } from "./connection";

const TabNameJoin = Symbol("TabNameJoin") as any as string;

/**
 * Holds all states
 */
export class PlatoApp extends React.Component<{}, {}> {

    layout: any;

    connection = new PlatoConnection({ 
        onHistoryUpdated: (channelName, history) => {
        }
    });

    get isSmallScreen(): boolean {
        return this.layout.base.classList.contains("is-small-screen");
    }

    get hasFixedDrawer(): boolean {
        return this.layout.base.classList.contains("mdl-layout--fixed-drawer");
    }

    toggleDrawer = () => {
        if (this.hasFixedDrawer && !this.isSmallScreen) {
            return;
        }
        this.layout.base.MaterialLayout.toggleDrawer();
    }

    contentForTab(tabName: string, currentTabName: string) {

    }

    chatForTab(tabName: string) {
        return <div>content</div>;
    }

    render() {
        return (
            <div id="app">
                <Layout fixed-header
                    ref={(el?: any) => { this.layout = el; }}>
                    <Layout.Header />
                    {/* <Sidebar onDrawerClick={this.toggleDrawer} /> */}

                    <Layout.Content>

                        <Layout.TabBar style={{
                            /* override default height */
                            height: "auto"
                        }}>
                            <Layout.Tab active={false} onClick={() => console.log("hey")}>JOIN</Layout.Tab>
                            <Layout.Tab  >tab2</Layout.Tab>
                        </Layout.TabBar>

                        {this.chatForTab("www")}
                    </Layout.Content>
                </Layout>
            </div >);
    }
}

function Header() {
    return (
        <Layout.Header>
            <Layout.HeaderRow>
                <Layout.Title>
                    Plato
        {/* <a href="/">Example</a> */}
                </Layout.Title>
                <Layout.Spacer />
                <TextField
                    placeholder="Join a channel"
                    type="search"
                    style="background-color:#FFF; color:#000; padding:10px;"
                />
                <Button>Join</Button>
            </Layout.HeaderRow>
        </Layout.Header>);
}

function ChannelTab({ channelName, isActive }:
    { channelName: string, isActive: boolean }) {
    return;
}