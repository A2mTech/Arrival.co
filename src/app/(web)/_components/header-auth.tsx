import Link from "next/link";
import { Fragment } from "react";
import { buttonVariants } from "@/components/ui/button";
import { siteUrls } from "@/config/urls";
import { createClient } from "@/utils/supabase/server";

export async function HeaderAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <section className="flex items-center space-x-2">
            {user ? (
                <Link
                    href={siteUrls.dashboard.home}
                    className={buttonVariants({
                        className: "flex items-center space-x-1",
                    })}
                >
                    <span>Dashboard</span>
                </Link>
            ) : (
                <Fragment>
                    <Link
                        href={siteUrls.auth.signup}
                        className={buttonVariants({
                            className: "flex items-center space-x-1",
                        })}
                    >
                        <span>Sign Up</span>
                        <span className="font-light italic">
                            {" "}
                            — it&apos;s free
                        </span>
                    </Link>
                </Fragment>
            )}
        </section>
    );
}