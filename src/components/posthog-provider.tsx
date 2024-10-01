"use client";

import { env } from "@/env";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as CSPostHogProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from '@supabase/supabase-js';

if (typeof window !== "undefined") {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        rate_limiting: {
            events_burst_limit: 10,
            events_per_second: 5,
        },
        loaded: (posthog) => {
            if (env.NODE_ENV === "development") posthog.debug();
        },
    });
}

type PostHogProviderProps = {
    children: React.ReactNode;
};

export function PosthogProvider({ children }: PostHogProviderProps) {
    return (
        <>
            <CapturePageviewClient captureOnPathChange={true} />
            <CSPostHogProvider client={posthog}>
                <PosthogAuthWrapper>{children}</PosthogAuthWrapper>
            </CSPostHogProvider>
        </>
    );
}

function PosthogAuthWrapper({ children }: PostHogProviderProps) {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                setUser(session?.user ?? null);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    useEffect(() => {
        if (user) {
            posthog.identify(user.id, {
                email: user.email,
                name: user.user_metadata?.full_name,
            });
        } else {
            posthog.reset();
        }
    }, [user]);

    return children;
}

type CapturePageviewClientProps = {
    captureOnPathChange?: boolean;
};

export function CapturePageviewClient({
                                          captureOnPathChange = false,
                                      }: CapturePageviewClientProps) {
    const pathname = usePathname();

    useEffect(() => {
        const handleCapturePageview = () => posthog.capture("$pageview");

        handleCapturePageview();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [captureOnPathChange ? pathname : undefined]);

    return null;
}