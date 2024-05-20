import React, { useContext, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import PasswordToggle from "../components/PasswordToggle";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { UserContext } from "../UserContext";
import GoogleIcon from "@mui/icons-material/Google";

const Login = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [redirect, setRedirect] = useState(false);
	const [passwordInputType, ToggleIcon] = PasswordToggle();

	const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

	const toastOptions = {
		position: "bottom-right",
		autoClose: 5000,
		pauseOnHover: true,
		draggable: true,
		theme: "dark",
	};

	async function login(e) {
		e.preventDefault();
		if (handleValidation()) {
			try {
				const { data } = await axios.post("/login", {
					username,
					password,
				});
				if (data.status === false) {
					toast.error(data.msg, toastOptions);
				} else {
					setLoggedInUsername(username);
					setId(data.id);
					setRedirect(true);
				}
			} catch (err) {
				console.log(err);
			}
		}
	}

	const handleValidation = () => {
		if (username === "") {
			toast.error("Username is required!", toastOptions);
			return false;
		} else if (password === "") {
			toast.error("Password is required!", toastOptions);
			return false;
		} else {
			return true;
		}
	};

	const loginWithGoogle = () => {
		window.open("http://localhost:5000/auth/google/callback", "_self");
	}

	if (redirect) {
		return <Navigate to="/" />
	}

	return (
		<div className="login-register bg-blue-50 w-full h-screen flex flex-col items-center justify-center">
			<form className="sm:w-[396.8px] w-64 mx-auto" onSubmit={login}>
				<h1 className="text-4xl font-semibold mb-6 text-center">
					Login
				</h1>
				<input
					type="text"
					placeholder="username"
					value={username}
					onChange={(ev) => setUsername(ev.target.value)}
				/>
				<div className="relative">
					<input
						type={passwordInputType}
						placeholder="Password"
						value={password}
						onChange={(ev) => setPassword(ev.target.value)}
					/>
					{password.length > 0 && (
						<span className="absolute right-3 bottom-[15px] cursor-pointer">
							{ToggleIcon}
						</span>
					)}
				</div>
				<button
					type="submit"
					className="bg-blue-500 text-white block w-full rounded-lg p-2"
				>
					Login
				</button>
				<p className="text-center mt-2">
					Don't have an account?{" "}
					<Link className="underline" to="/register">
						Register
					</Link>
				</p>
			</form>
			<button className="mt-5 mb-64 sm:w-[396.8px] w-64 mx-auto bg-white py-[5px] border border-black rounded-md" onClick={loginWithGoogle}>
				<GoogleIcon /> Sign in with Google
			</button>
			<ToastContainer />
		</div>
	);
};

export default Login;
