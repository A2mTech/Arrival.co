"use server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";


const waitlistUsersSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
});

type AddUserToWaitlistMutationProps = z.infer<typeof waitlistUsersSchema>;

export async function addUserToWaitlistMutation({
                                                    name,
                                                    email,
                                                }: AddUserToWaitlistMutationProps) {
    const supabase = createClient();


    const parseData = waitlistUsersSchema.safeParse({
        name,
        email,
    });

    if (!parseData.success) {
        return {
            success: false,
            error: parseData.error.message,
        };
    }

    const { data } = parseData;

    try {
        const { error } = await supabase
            .from('waitlist_users')
            .upsert({ name: data.name, email: data.email }, { onConflict: 'email' });

        if (error) throw error;

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            error: "Something went wrong, please try again later",
        };
    }
}

export async function deleteWaitlistUserMutation({ id }: { id: string }) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('waitlist_users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            error: "Something went wrong, please try again later",
        };
    }
}