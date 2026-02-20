import { Outlet } from 'react-router'

export default function AuthLayout() {
	return (
		<>
			<div className="min-h-screen m-0 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex justify-center items-center">
				<Outlet />
			</div>
		</>
	)
}
