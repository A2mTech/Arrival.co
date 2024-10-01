"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/utils/supabase/client";

type UserImageFormProps = {
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
};

const PROFILE_MAX_SIZE = 4 * 1024 * 1024; // 4MB

export function UserImageForm({ user }: UserImageFormProps) {
    const router = useRouter();
    const supabase = createClient();

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
    }, []);

    const { isDragActive, isDragAccept, getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif']
        },
        maxFiles: 1,
        maxSize: PROFILE_MAX_SIZE,
    });

    const handleUpdateImage = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            const file = files[0];
            if (!file) {
                throw new Error("No file selected");
            }

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}-${Math.random()}.${fileExt}`;


            // TODO: Add progress bar for uploading
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    upsert: true,
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('account')
                .update({ image: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            router.refresh();
            setFiles([]);
            setModalOpen(false);
            toast.success("Image uploaded successfully");
        } catch (error) {
            toast.error(
                (error as { message?: string })?.message ??
                "Image could not be uploaded"
            );
        } finally {
            setIsUploading(false);
        }
    };
    return (
        <Dialog
            onOpenChange={(o) => {
                if (isUploading) return;
                setModalOpen(o);
                setFiles([]);
            }}
            open={modalOpen}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Profile Image</CardTitle>
                    <CardDescription>
                        Add a profile image to make your account more personal.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.image ? user.image : ""} />
                        <AvatarFallback className="text-3xl">
                            {user.name ? user.name[0] : ''}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-light text-muted-foreground">
                            Max file size: {PROFILE_MAX_SIZE / 1024 / 1024}MB
                        </p>
                        <p className="text-sm font-light text-muted-foreground">
                            Recommended size: 600x600
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <DialogTrigger asChild>
                        <Button type="button">Upload Image</Button>
                    </DialogTrigger>
                </CardFooter>
            </Card>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload a new profile image here</DialogTitle>
                    <DialogDescription>
                        Drag and drop the image here, or click to select a file
                    </DialogDescription>
                </DialogHeader>

                {files.length > 0 ? (
                    <div className="flex items-center gap-4">
                        <img
                            src={files[0] ? URL.createObjectURL(files[0]) : ""}
                            alt="preview"
                            className="h-36 w-36 rounded-full object-cover"
                        />
                        <Button
                            onClick={() => setFiles([])}
                            type="button"
                            variant="destructive"
                            size="icon"
                        >
                            <Trash2Icon className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "flex h-36 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border transition-[border] hover:border-primary",
                            isDragActive && "border-primary",
                        )}
                    >
                        <input {...getInputProps()} />
                        <p className="p-8 text-center text-sm text-muted-foreground">
                            {isDragActive
                                ? isDragAccept
                                    ? "Drop the image here"
                                    : "This file type is not supported"
                                : "Drag and drop the image here, or click to select a file not more than 4MB in size."}
                        </p>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            disabled={isUploading}
                            type="button"
                            variant="outline"
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleUpdateImage}
                        disabled={isUploading || files.length === 0}
                        type="button"
                        className="gap-2"
                    >
                        {isUploading ? (
                            <Icons.loader className="h-4 w-4" />
                        ) : null}
                        <span>
                            {isUploading ? `Uploading (${uploadProgress}%)` : "Upload"}
                        </span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}