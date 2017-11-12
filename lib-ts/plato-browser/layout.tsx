import { React } from "../browser";

require("material-design-lite");

import { Button, Card, Icon, Layout, Navigation, TextField, LayoutHeader } from "preact-mdl";
const { Header, } = Layout;

export function AppRoot() {




    return <div id="app">
        <Layout fixed-header fixed-drawer>
            <LayoutHeader>
                <Card>HH</Card>
            </LayoutHeader>
            <Header>Header</Header>

            <Layout.Content>
                Hey
            </Layout.Content>
        </Layout>
    </div>;
}
