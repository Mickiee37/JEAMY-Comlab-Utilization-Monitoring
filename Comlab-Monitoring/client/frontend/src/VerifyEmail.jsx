import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const emailToken = query.get('token'); // Get the token from the query string
    const navigate = useNavigate();
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);

    // Log the extracted token for debugging
    console.log('Extracted Email Token:', emailToken);

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/users/verify-email?token=${emailToken}`,
                    { method: 'GET' }
                );

                const data = await response.json(); // Parse the response as JSON
                console.log('Verification response:', data); // Log the response for debugging
                if (response.ok && data.success) {
                    setStatus('success');
                } else {
                    setStatus('error'); // Handle failure cases
                }
            } catch (error) {
                console.error('Error during email verification:', error);
                setStatus('error');
            } finally {
                setLoading(false);
            }
        };

        if (emailToken) {
            verifyEmail();
        } else {
            console.error('No email token provided.'); 
            setStatus('error');
            setLoading(false);
        }
    }, [emailToken]);

    useEffect(() => {
        if (status === 'success') {
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
    }, [status, navigate]);

    return (
        <div className="verify-email-container">
            {loading ? (
                <p>Verifying email...</p>
            ) : status === 'success' ? (
                <div>
                    <h2 className="verify-email-message verify-email-error">
                        An error occurred while verifying your email. Please try again later.
                    </h2>
                </div>
            ) : (
                <div>
                <h2 className="verify-email-message verify-email-success">
                    Email Verified!
                </h2>
            </div>
            )}
        </div>
    );
};

export default VerifyEmail;
