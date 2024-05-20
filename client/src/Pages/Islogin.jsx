import React, { useContext } from "react";
import Chat from "./Chat";
import { UserContext } from "../UserContext";
import Login from "./Login";
import { Navigate } from "react-router-dom";

const Islogin = () => {
    const { username } = useContext(UserContext);
    
    if (!username)
        return <Login />

    return <Chat />;
};

export default Islogin;
