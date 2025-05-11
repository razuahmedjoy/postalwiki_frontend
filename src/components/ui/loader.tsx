// we will use this component to show a loading screen , full screen

import { Loader2 } from "lucide-react";

export const Loader = () => {
    return <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
    </div>;
};
