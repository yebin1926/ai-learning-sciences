"use client";

import { useState } from "react";
import GuideOverlay from "@/components/GuideOverlay";
import LearnSession from "@/components/LearnSession";

export default function LearnPage() {
    const [showGuide, setShowGuide] = useState<boolean>(true);

    if (showGuide) {
        return <GuideOverlay onComplete={() => setShowGuide(false)} />;
    }

    return <LearnSession />;
}
