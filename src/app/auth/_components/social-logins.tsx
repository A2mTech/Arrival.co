"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { siteUrls } from "@/config/urls";
import { useState } from "react";
import { toast } from "sonner";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function SocialLogins() {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClientComponentClient();

    const handleSocialLogin = async (provider: 'github' | 'google') => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}${siteUrls.auth.callback}`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error(error);
            toast.error("An error occurred with social login. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col space-y-2">
            <Button
                onClick={() => handleSocialLogin('github')}
                variant="outline"
                className="w-full gap-2"
                disabled={isLoading}
            >
                <Icons.gitHub className="h-3.5 w-3.5 fill-foreground" />
                <span>Continue with Github</span>
            </Button>
            <Button
                onClick={() => handleSocialLogin('google')}
                variant="outline"
                className="w-full gap-2"
                disabled={isLoading}
            >
                <Icons.google className="h-3.5 w-3.5 fill-foreground" />
                <span>Continue with Google</span>
            </Button>
        </div>
    );
}