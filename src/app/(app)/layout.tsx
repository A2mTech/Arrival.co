import React, { Fragment } from "react";

type AppLayoutProps = {
    children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <Fragment>
            {children}
        </Fragment>
    );
}
