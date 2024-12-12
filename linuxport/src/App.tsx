import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "./components/ui/dropdown-menu";
import { Button } from "./components/ui/button.tsx";
import { Moon, Sun } from "lucide-react";
import { useTheme} from "./components/ui/themeprovider.tsx";
import UserProfile from "./components/user-profile.tsx";




const App = () => {
    const { setTheme } = useTheme();

    return (
        <div className="relative flex flex-col min-h-screen">
            {/* Theme Dropdown */}
            <header className="absolute top-4 right-4 z-50">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme('light')}>
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')}>
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('system')}>
                            System
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

    

            {/* Main Content */}
            <main className="relative z-10 flex justify-center items-center min-h-screen">
                <UserProfile />
            </main>
        </div>
    );
};

export default App;