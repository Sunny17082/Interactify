import React, { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const PasswordToggle = () => {
    const [visible, setVisible] = useState(false);

    const icon = visible ? <VisibilityOffIcon onClick={() => setVisible(!visible) } /> : <VisibilityIcon onClick={()=>{setVisible(!visible)}} />

    const inputType = visible ? "text" : "password";

	return [inputType, icon];
};

export default PasswordToggle;
