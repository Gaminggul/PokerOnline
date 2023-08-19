import { Button } from "@nextui-org/react";
import { noop } from "functional-utilities";
import React, { useState, useEffect } from "react";
import { DarkModeSwitch } from "react-toggle-dark-mode";

const DarkModeToggle: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove("dark");
        } else {
            document.documentElement.classList.add("dark");
        }
        setIsDarkMode(!isDarkMode);
    };

    return (
        <Button
            className="flex w-fit self-center rounded-md"
			color="secondary"
            onClick={toggleDarkMode}
			variant="shadow"
        >
            <p className="text-sm">Turn on {isDarkMode ? "light" : "dark"} mode</p>
            <DarkModeSwitch size={40} onChange={noop} checked={isDarkMode} sunColor="#ffe666"/>
        </Button>
    );
};

export default DarkModeToggle;
