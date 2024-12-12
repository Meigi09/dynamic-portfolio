import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import axios from "axios";
import UserDialog from "./user-dialog.tsx";

// Define interfaces for data structures
interface Project {
    name: string;
    link: string;
}

interface Social {
    platform: string;
    link: string;
}

// Define a more strict type for user data
interface UserData {
    profilePicture: string;
    fullName: string;
    profession: string;
    skills: string[];
    projects: Project[];
    socials: Social[];
}

const UserProfile: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    useEffect(() => {
        // Fetch user data from the backend API
        const fetchUserData = async () => {
            try {
                const response = await axios.get("http://localhost:3000/api/users");
                console.log(response.data);
                setUserData(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching user data:", error);
                setError("Failed to fetch user data");
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSave = (newUserData: UserData) => {
        setUserData(newUserData);
    };

    const handleEditProfile = () => {
        setIsDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>No user data available</p>
                <Button onClick={handleEditProfile} className="ml-4">Create Profile</Button>
            </div>
        );
    }

    return (
        <>
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="flex flex-col items-center relative">
                    <Button
                        onClick={handleEditProfile}
                        className="absolute top-2 right-2"
                        variant="outline"
                    >
                        Edit Profile
                    </Button>
                    <img
                        src={userData.profilePicture}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover mb-4"
                    />
                    <CardTitle className="text-center">
                        <h1 className="text-2xl font-bold">{userData.fullName}</h1>
                        <p className="text-muted-foreground">{userData.profession}</p>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <section className="mb-4">
                        <h2 className="text-lg font-semibold mb-2">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {/* Ensure that skills is defined and is an array before using .map() */}
                            {userData.skills?.map((skill: string, index: number) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    </section>

                    <section className="mb-4">
                        <h2 className="text-lg font-semibold mb-2">Projects</h2>
                        <ul className="space-y-2">
                            {/* Ensure that projects is defined and is an array before using .map() */}
                            {userData.projects?.map((project: Project, index: number) => (
                                <li key={index} className="flex justify-between items-center">
                                    <span>{project.name}</span>
                                    <a
                                        href={project.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        View Project
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-2">Contact</h2>
                        <ul className="space-y-2">
                            {/* Ensure that socials is defined and is an array before using .map() */}
                            {userData.socials?.map((social: Social, index: number) => (
                                <li key={index}>
                                    <a
                                        href={social.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                                    >
                                        {social.platform}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                </CardContent>

            </Card>

            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSave}
            />
        </>
    );
};

export default UserProfile;