import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SverseLogo, HamburgerIcon, SearchIcon, MicIcon, BellIcon, VideoPlusIcon } from '../../constants';
import { AuthContext } from '../../App';
import { auth, googleProvider } from '../../services/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    const { user, loading } = useContext(AuthContext);

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };
    
    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };
    
    return (
        <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
                <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-zinc-700 focus:outline-none">
                    <HamburgerIcon className="h-6 w-6" />
                </button>
                <Link to="/" className="flex-shrink-0">
                    <SverseLogo />
                </Link>
            </div>

            {/* Center Section */}
            <div className="hidden md:flex flex-1 max-w-2xl items-center justify-center mx-4">
                <div className="flex w-full items-center">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-l-full px-4 py-2 focus:outline-none focus:border-red-500"
                    />
                    <button className="bg-zinc-700 border border-zinc-700 border-l-0 px-5 py-2 rounded-r-full hover:bg-zinc-600">
                        <SearchIcon className="h-6 w-6" />
                    </button>
                </div>
                <button className="ml-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700">
                    <MicIcon className="h-6 w-6" />
                </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-zinc-700 md:hidden">
                    <SearchIcon className="h-6 w-6" />
                </button>
                {!loading && (
                    <>
                        {user ? (
                            <>
                                <Link to="/upload" className="p-2 rounded-full hover:bg-zinc-700">
                                    <VideoPlusIcon className="h-6 w-6" />
                                </Link>
                                <button className="p-2 rounded-full hover:bg-zinc-700">
                                    <BellIcon className="h-6 w-6" />
                                </button>
                                <div className="relative group">
                                    <img
                                        src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`}
                                        alt="User Avatar"
                                        className="h-8 w-8 rounded-full cursor-pointer"
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-md shadow-lg py-1 hidden group-hover:block">
                                        <div className="px-4 py-2 text-sm text-gray-400">
                                            <div>{user.displayName}</div>
                                            <div className="font-medium truncate">{user.email}</div>
                                        </div>
                                        <div className="border-t border-zinc-700 my-1"></div>
                                        {user.isAdmin && <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-zinc-700">Admin Panel</Link>}
                                        <a href="#" className="block px-4 py-2 text-sm hover:bg-zinc-700">Your Channel</a>
                                        <a href="#" className="block px-4 py-2 text-sm hover:bg-zinc-700">Settings</a>
                                        <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm hover:bg-zinc-700">Sign out</button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <button onClick={handleSignIn} className="flex items-center space-x-2 border border-blue-500 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16.5c2.572 0 4.96.746 7.025 2.04.538 1.104.975 2.296 1.32 3.562A15.003 15.003 0 0112 21a15.003 15.003 0 01-10.345-4.125c.345-1.266.782-2.458 1.32-3.562zM12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" /></svg>
                                <span>Sign in</span>
                            </button>
                        )}
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;