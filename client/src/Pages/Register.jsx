import axios from "axios";
import React, { useContext, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserContext } from "../UserContext";
import { Link, Navigate } from "react-router-dom";
import PasswordToggle from "../components/PasswordToggle";
import PasswordStrengthBar from "react-password-strength-bar";
import GoogleIcon from "@mui/icons-material/Google";

const Register = () => {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordFocus, setPasswordFocus] = useState(false);
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

	const handleValidation = () => {
		if (password !== confirmPassword) {
			toast.error(
				"Password and confirm password should be same!",
				toastOptions
			);
			return false;
		} else if (username.length < 3) {
			toast.error(
				"Username must include at least 3 characters!",
				toastOptions
			);
			return false;
		} else if (password.length < 8) {
			toast.error(
				"password must include at least 8 characters!",
				toastOptions
			);
			return false;
		} else {
			return true;
		}
	};

	async function register(e) {
		e.preventDefault();
		if (handleValidation()) {
			try {
				const { data } = await axios.post("/register", {
					username,
					email,
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

	const loginWithGoogle = () => {
		window.open("http://localhost:5000/auth/google/callback", "_self");
	};

	if (redirect) {
		return <Navigate to="/" />;
	}

	return (
		<div className="login-register relative bg-blue-50 w-full h-screen flex flex-col items-center justify-center">
			<form
				className="sm:max-w-md max-w-64 mx-auto"
				onSubmit={register}
			>
				<h1 className="text-4xl font-semibold mb-6 text-center">
					Register
				</h1>
				<input
					type="text"
					placeholder="username"
					value={username}
					onChange={(ev) => setUsername(ev.target.value)}
				/>
				<input
					type="email"
					placeholder="email"
					value={email}
					onChange={(ev) => setEmail(ev.target.value)}
				/>
				<div className="relative">
					<input
						type={passwordInputType}
						placeholder="Password"
						value={password}
						onChange={(ev) => setPassword(ev.target.value)}
						onFocus={() => setPasswordFocus(true)}
						onBlur={() => setPasswordFocus(false)}
					/>
					{password.length > 0 && (
						<span className="absolute right-3 bottom-[15px] cursor-pointer">
							{ToggleIcon}
						</span>
					)}
				</div>
				{password.length > 0 && passwordFocus && (
					<PasswordStrengthBar className="px-5" password={password} />
				)}
				<input
					type="password"
					placeholder="Confirm Password"
					value={confirmPassword}
					onChange={(ev) => setConfirmPassword(ev.target.value)}
				/>
				<button
					type="submit"
					className="bg-blue-500 text-white block w-full rounded-lg p-2"
				>
					Register
				</button>
				<p className="text-center mt-2">
					Already have an account?{" "}
					<Link className="underline" to="/login">
						Login
					</Link>
				</p>
			</form>
			<button
				className="mt-5 mb-64 sm:w-[396.8px] w-64 mx-auto bg-white py-[5px] border border-black rounded-md"
				onClick={loginWithGoogle}
			>
				<GoogleIcon /> Sign in with Google
			</button>
			<ToastContainer />
		</div>
	);
};

export default Register;
