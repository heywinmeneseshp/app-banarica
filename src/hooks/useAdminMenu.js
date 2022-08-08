import { useState } from "react";


const initialAdminMenu = {
    inicio: true
}

const useAdminMenu = () => {
    const [adminMenu, setAdminMenu] = useState(initialAdminMenu);
    

    const hadleOpenWindows = (name) => {
        setAdminMenu({
            [name]: true
        })
    };

    const hadleCloseWindows = () => {
        setAdminMenu({
            inicio: false
        });
    }

    return {
        adminMenu,
        hadleOpenWindows,
        hadleCloseWindows
    };
};

export default useAdminMenu;