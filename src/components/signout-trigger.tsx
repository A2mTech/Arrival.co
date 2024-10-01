"use client";

import { Slot } from "@radix-ui/react-slot";
import React from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type SignoutTriggerProps = {
    callbackUrl?: string;
    redirect?: boolean;
    asChild?: boolean;
    children?: React.ReactNode;
} & React.HTMLAttributes<HTMLButtonElement>;

export function SignoutTrigger({
                                   callbackUrl,
                                   redirect = true,
                                   asChild,
                                   children,
                                   ...props
                               }: SignoutTriggerProps) {
    const Comp = asChild ? Slot : "button";
    const supabase = createClient();
    const router = useRouter();

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Error signing out:", error);
        } else if (redirect) {
            router.push(callbackUrl || "/");
        }
    };

    return (
        <Comp
            onClick={handleSignOut}
            {...props}
        >
            {children}
        </Comp>
    );
}