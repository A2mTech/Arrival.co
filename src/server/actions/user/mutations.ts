"use server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";


const userSchema = z.object({
    name: z.string().min(1).max(255),
    image: z.string().url().nullable(),
    role: z.enum(['User', 'Admin', 'Super Admin']),
    id: z.string().uuid(),
});

/**
 * Update the name of the user
 * @param name The new name
 */

const updateNameSchema = userSchema.pick({ name: true });

type UpdateNameProps = z.infer<typeof updateNameSchema>;

export async function updateNameMutation({ name }: UpdateNameProps) {
    const supabase = createClient();


    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const updateNameParse = updateNameSchema.safeParse({ name });

    if (!updateNameParse.success) {
        throw new Error("Invalid name", {
            cause: updateNameParse.error.errors,
        });
    }

    const { error } = await supabase
        .from('account')
        .update({ name: updateNameParse.data.name })
        .eq('id', user.id);

    if (error) throw error;
}

/**
 * Update the image of the user
 * @param image The new image
 */

const updateImageSchema = userSchema.pick({ image: true });

type UpdateImageProps = z.infer<typeof updateImageSchema>;

export async function updateImageMutation({ image }: UpdateImageProps) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const updateImageParse = updateImageSchema.safeParse({ image });

    if (!updateImageParse.success) {
        throw new Error("Invalid image", {
            cause: updateImageParse.error.errors,
        });
    }

    const { error } = await supabase
        .from('account')
        .update({ image: updateImageParse.data.image })
        .eq('id', user.id);

    if (error) throw error;
}

/**
 * Update the role of a user (super admin only)
 * @param id The user id
 * @param role The new role
 */

const updateRoleSchema = userSchema.pick({
    role: true,
    id: true,
});

type UpdateRoleProps = z.infer<typeof updateRoleSchema>;

export async function updateRoleMutation({ role, id }: UpdateRoleProps) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    // Check if user is super admin
    const { data: userData } = await supabase
        .from('account')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userData?.role !== 'Super Admin') {
        throw new Error("Not authorized");
    }

    const updateRoleParse = updateRoleSchema.safeParse({ role, id });

    if (!updateRoleParse.success) {
        throw new Error("Invalid role data", {
            cause: updateRoleParse.error.errors,
        });
    }

    const { error } = await supabase
        .from('account')
        .update({ role: updateRoleParse.data.role })
        .eq('id', updateRoleParse.data.id);

    if (error) throw error;
}

/**
 * Delete a user (super admin only)
 * @param id The user id
 */

const deleteUserSchema = userSchema.pick({ id: true });

type DeleteUserProps = z.infer<typeof deleteUserSchema>;

export async function deleteUserMutation({ id }: DeleteUserProps) {
    const supabase = createClient();


    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    // Check if user is super admin
    const { data: userData } = await supabase
        .from('account')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userData?.role !== 'Super Admin') {
        throw new Error("Not authorized");
    }

    const deleteUserParse = deleteUserSchema.safeParse({ id });

    if (!deleteUserParse.success) {
        throw new Error("Invalid user id", {
            cause: deleteUserParse.error.errors,
        });
    }

    const { error: deleteAccountError } = await supabase
        .from('account')
        .delete()
        .eq('userId', deleteUserParse.data.id);

    if (deleteAccountError) throw deleteAccountError;

    const { error: deleteUserError } = await supabase
        .from('account')
        .delete()
        .eq('id', deleteUserParse.data.id);

    if (deleteUserError) throw deleteUserError;
}

/**
 *  complete new user setup
 * @returns
 */

export async function completeNewUserSetupMutation() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const { error } = await supabase
        .from('account')
        .update({ is_new_user: false })
        .eq('id', user.id);

    if (error) throw error;
}