import { AppPageShell } from "@/app/(app)/_components/page-shell";
import { UserNameForm } from "@/app/(app)/(user)/profile/settings/_components/user-name-form";
import { UserImageForm } from "@/app/(app)/(user)/profile/settings/_components/user-image-form";
import { UserAppearanceForm } from "@/app/(app)/(user)/profile/settings/_components/user-appearance-form";
import { profileSettingsPageConfig } from "@/app/(app)/(user)/profile/settings/_constants/page-config";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('account')
        .select('*')
        .eq('id', user.id)
        .single();

    const userWithProfile = {
        ...user,
        ...profile
    };

    return (
        <AppPageShell
            title={profileSettingsPageConfig.title}
            description={profileSettingsPageConfig.description}
        >
            <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                <UserImageForm user={userWithProfile} />

                <UserNameForm user={userWithProfile} />

                <UserAppearanceForm />
            </div>
        </AppPageShell>
    );
}