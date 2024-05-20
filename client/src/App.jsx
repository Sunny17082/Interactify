import axios from "axios";
import { UserContextProvider } from "./UserContext";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Chat from "./Pages/Chat";
import Islogin from "./Pages/Islogin";

function App() {
    axios.defaults.baseURL = "http://localhost:5000";
    axios.defaults.withCredentials = true;

    return (
        <UserContextProvider>
            <BrowserRouter>
                <Routes >
                    <Route path="/" element={<Islogin />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                </Routes>
            </BrowserRouter>
		</UserContextProvider>
	);
}

export default App;
