import { useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import FormInput from "../../components/auth/FormInput.jsx";
import { IoEyeOffOutline } from "react-icons/io5";
import { IoEyeOutline } from "react-icons/io5";
import { isEmpty } from "../../utilities/utils.js";
import { registerService } from "../../services/auth.service.js";
import useToast from "../../contexts/ui/useToast.js";
import { getErrorMessage } from "../../utilities/errors.js";

export default function Login() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const elementFirstNameId = useId();
    const elementLastNameId = useId();
    const elementUserNameId = useId();
    const elementEmailId = useId();
    const elementPasswordId = useId();
    const elementConfirmPasswordId = useId();

    const navigate = useNavigate();
    const toast = useToast();

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    function validateForm() {
        const newErrors = {};

        if (!firstName.trim()) {
            newErrors.firstName = "First name cannot be empty";
        }

        if (!lastName.trim()) {
            newErrors.lastName = "Last name cannot be empty";
        }

        if (!userName.trim()) {
            newErrors.userName = "Username cannot be empty";
        }

        if (!email.trim()) {
            newErrors.email = "Email cannot be empty";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Invalid email format";
        }

        if (!password.trim()) {
            newErrors.password = "Password cannot be empty";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = "Confirm Password cannot be empty";
        } else if (confirmPassword !== password) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validateForm();
        setErrors(validationErrors);
        if (!isEmpty(validationErrors)) return;

        setLoading(true);
        setErrors({});

        try {
            await registerService({
                firstName,
                lastName,
                userName,
                email,
                password,
                confirmPassword,
            });

            navigate("/auth/login", { replace: true });
        } catch (err) {
            if (err.fieldErrors) {
                setErrors(err.fieldErrors); // backend field errors
            } else {
                const message = getErrorMessage(err, "Something went wrong...");
                toast.error(message);
                setErrors({ general: message });
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-">
            <div className="flex flex-col gap-8 text-lg">

                <div className="flex flex-col gap-4">
                    {/* First Name */}
                    <FormInput
                        id={elementFirstNameId}
                        type="text"
                        name="user-first-name"
                        placeholder="Enter your first name..."
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        error={errors.firstName}
                    />

                    {/* Last Name */}
                    <FormInput
                        id={elementLastNameId}
                        type="text"
                        name="user-last-name"
                        placeholder="Enter your last name..."
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        error={errors.lastName}
                    />

                    {/* User Name */}
                    <FormInput
                        id={elementUserNameId}
                        type="text"
                        name="user-name"
                        placeholder="Enter your username..."
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        error={errors.userName}
                    />

                    {/* EMAIL */}
                    <FormInput
                        id={elementEmailId}
                        type="email"
                        name="user-email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                    />

                    {/* PASSWORD */}
                    <div className="relative flex items-center justify-center w-full">
                        <FormInput
                            id={elementPasswordId}
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Enter your password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                            additionalContainerClasses="w-full"
                        />

                        {/* Show / Hide Password */}
                        {password ? (
                            <div
                                className="absolute right-4"
                                onClick={() => setShowPassword(prev => !prev)}
                            >
                                {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                            </div>
                        ) : ""}
                    </div>

                    {/* Confirm Password */}
                    <div className="relative flex items-center justify-center w-full">
                        <FormInput
                            id={elementConfirmPasswordId}
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm-password"
                            placeholder="Confirm your password..."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={errors.confirmPassword}
                            additionalContainerClasses="w-full"
                        />

                        {/* Show / Hide Password */}
                        {confirmPassword ? (
                            <div
                                className="absolute right-4"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                            >
                                {showConfirmPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                            </div>
                        ) : ""}
                    </div>
                </div>

                {errors.auth &&
                    <div className="flex justify-center text-red-500">
                        <p>{errors.auth}</p>
                    </div>
                }

                {errors.general &&
                    <div className="flex justify-center text-red-500">
                        <p>{errors.general}</p>
                    </div>
                }

                {/* SUBMIT */}
                <div className="flex flex-col justify-center items-center w-full">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`bg-blue-500 py-2 px-8 rounded-lg w-full
                                        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <span className="text-white">
                            {loading ? "Creating Account..." : "Create Account"}
                        </span>
                    </button>
                </div>

                {/* Back */}
                <Link to="/auth/login">
                    <div className="flex items-center justify-center text-sm">
                        Already have an account? Log in...
                    </div>
                </Link>
            </div>
        </form>
    );
}
