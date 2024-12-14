import React, { useState, useRef } from "react";
import axios from "axios";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast.ts";
import { PhotoIcon } from '@heroicons/react/24/solid'

const UserDialog = ({
    open,
    onOpenChange,
    onSave
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onSave?: (data: any) => void
}) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const API_BASE_URL = 'http://localhost:3000/api/';
    const [formData, setFormData] = useState({
        profilePicture: null as File | null,
        fullName: "",
        profession: "",
        skills: "",
        projects: "",
        socials: "",
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type and size
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!validTypes.includes(file.type)) {
                toast({
                    title: "Invalid File Type",
                    description: "Please upload a PNG, JPG, or GIF image",
                    variant: "destructive"
                });
                return;
            }

            if (file.size > maxSize) {
                toast({
                    title: "File Too Large",
                    description: "Image must be under 10MB",
                    variant: "destructive"
                });
                return;
            }

            // Set profile picture and create preview
            setFormData({ ...formData, profilePicture: file });
            
            // Create image preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        try {
            // Validate required fields
            if (!formData.fullName) {
                toast({
                    title: "Validation Error",
                    description: "Full Name is required",
                    variant: "destructive"
                });
                return;
            }

            // Create form data for file upload
            const submitData = new FormData();
            
            // Append other form fields
            submitData.append('fullName', formData.fullName);
            submitData.append('profession', formData.profession || '');
            
            // Handle skills (comma-separated)
            const skills = formData.skills 
                ? formData.skills.split(',').map(s => s.trim()) 
                : [];
            submitData.append('skills', JSON.stringify(skills));
            
            // Handle projects (name|link format)
            const projects = formData.projects
                ? formData.projects.split(',').map(p => {
                    const [name, link] = p.split('|').map(s => s.trim());
                    return { name, link };
                })
                : [];
            submitData.append('projects', JSON.stringify(projects));
            
            // Handle socials (platform|link format)
            const socials = formData.socials
                ? formData.socials.split(',').map(s => {
                    const [platform, link] = s.split('|').map(s => s.trim());
                    return { platform, link };
                })
                : [];
            submitData.append('socials', JSON.stringify(socials));
            
            // Append profile picture if exists
            if (formData.profilePicture) {
                submitData.append('profilePicture', formData.profilePicture);
            }

            // Send data to backend
            const response = await axios.post(`${API_BASE_URL}users`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Show success toast
            toast({
                title: "Success",
                description: "User profile saved successfully",
                variant: "default"
            });

            // Optional: call onSave callback if provided
            if (onSave) {
                onSave(response.data);
            }

            // Close dialog
            onOpenChange(false);

            // Reset form
            setFormData({
                profilePicture: null,
                fullName: "",
                profession: "",
                skills: "",
                projects: "",
                socials: "",
            });
            setPreviewImage(null);
        } catch (error) {
            // Show error toast
            toast({
                title: "Error",
                description: "Failed to save user profile",
                variant: "destructive"
            });
            console.error("Save error:", error);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enter Your Details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="profilePicture" className="text-right">
                            Profile Picture
                        </Label>
                        <div 
                            className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 w-full"
                            onClick={triggerFileInput}
                        >
                            <div className="text-center">
                                {previewImage ? (
                                    <img 
                                        src={previewImage} 
                                        alt="Profile Preview" 
                                        className="mx-auto max-h-32 object-cover rounded"
                                    />
                                ) : (
                                    <PhotoIcon aria-hidden="true" className="mx-auto size-12 text-gray-300" />
                                )}
                                <div className="mt-4 flex text-sm/6 text-gray-600">
                                    <span className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                                        {previewImage ? 'Change File' : 'Upload a file'}
                                    </span>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs/5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                        <input 
                            ref={fileInputRef}
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fullName" className="text-right">
                            Full Name
                        </Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            placeholder="Your full name"
                            className="col-span-3"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="profession" className="text-right">
                            Profession
                        </Label>
                        <Input
                            id="profession"
                            name="profession"
                            placeholder="Your profession"
                            className="col-span-3"
                            value={formData.profession}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="skills" className="text-right">
                            Skills
                        </Label>
                        <Input
                            id="skills"
                            name="skills"
                            placeholder="Comma-separated skills"
                            className="col-span-3"
                            value={formData.skills}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="projects" className="text-right">
                            Projects
                        </Label>
                        <Input
                            id="projects"
                            name="projects"
                            placeholder="name|link, separated by comma"
                            className="col-span-3"
                            value={formData.projects}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="socials" className="text-right">
                            Socials
                        </Label>
                        <Input
                            id="socials"
                            name="socials"
                            placeholder="platform|link, separated by comma"
                            className="col-span-3"
                            value={formData.socials}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit}>
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UserDialog;