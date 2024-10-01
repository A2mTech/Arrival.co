import { createClient } from "@/utils/supabase/server";
import { NewUserProfileForm } from "@/app/(app)/_components/new-user-profile-form";
import { NewUserOrgForm } from "@/app/(app)/_components/new-user-org-form";
import { cookies } from "next/headers";
import { new_user_setup_step_cookie } from "@/config/cookie-keys";

export async function NewUserSetup() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: accountData, error } = await supabase
        .from('account')
        .select('is_new_user')
        .eq('id', user?.id ?? '')
        .single();

    if (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        return null;
    }

    if (!accountData?.is_new_user) {
        return null;
    }

    const currentStep =
        cookies().get(`${new_user_setup_step_cookie}${user?.id}`)?.value ?? 1;

    const forms = {
        1: <NewUserProfileForm user={user!} currentStep={Number(currentStep)} />,
        2: (
            <NewUserOrgForm
                currentStep={Number(currentStep)}
                userId={user?.id ?? ''}
            />
        ),
    };

    return (
        <div className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-center bg-black/80">
            <div className="w-full max-w-xl">
                {forms[currentStep as keyof typeof forms]}
            </div>
        </div>
    );
}