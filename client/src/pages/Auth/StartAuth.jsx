import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { FaFacebookMessenger } from "react-icons/fa6";
import useAuth from '../../contexts/auth/useAuth';
import ThemeToggle from '../../components/common/ThemeToggle';

export default function StartAuth() {
	const { authStatus, currentUser } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const isLoggingIn = location.pathname === "/auth/login";
	const isRegistering = location.pathname === "/auth/register";

	useEffect(() => {
		if (authStatus === "authenticated" && currentUser.isVerified) {
			navigate("/chats");
		}
	}, [authStatus, navigate, currentUser]);

	return (
		<div className="relative min-h-screen m-0 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col justify-center items-center">
			<div className="absolute top-4 right-4">
				<ThemeToggle compact />
			</div>

			<div className='flex flex-col justify-center h-full items-center p-10 w-full flex-1'>

				{/* Logo, Name, Tagline */}
				<div className='flex flex-col items-center gap-11 mb-10'>
					<div className="flex items-center justify-center mr-6">
						<FaFacebookMessenger className='text-blue-600 text-7xl' />
					</div>
					{(isLoggingIn || isRegistering) && (
						<span className='font-light text-4xl text-center'>
							Connect with your favorite people.
						</span>
					)}
				</div>

				{/* Auth pages */}
				<div className="max-w-md w-full mx-auto flex flex-col items-center">
					<Outlet />
				</div>
			</div>

			<div className="text-sm flex gap-6 justify-center items-center p-4">
				{
					isLoggingIn && (
						<>
							<Link to="/auth/register" className="hover:underline">
								Not on Facebook?
							</Link>
							<Link to="/auth/forgot-password">
								<p className="font-bold hover:underline text-blue-500">Forgot password</p>
							</Link>
						</>
					)
				}
			</div>
		</div>
	)
}
