import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
    isOpen: boolean;
}

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors ${
                isActive ? 'bg-zinc-700' : ''
            }`
        }
    >
        <div className="w-6 h-6 mr-4">{icon}</div>
        <span>{label}</span>
    </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(true);

    const mainNavItems = [
        { to: "/", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>, label: "Home" },
        { to: "/shorts", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>, label: "Shorts" },
        { to: "/subscriptions", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>, label: "Subscriptions" },
    ];

    const secondaryNavItems = [
        { to: "/history", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "History" },
        { to: "/liked", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.25a2.25 2.25 0 01-2.25-2.25v-6.75a2.25 2.25 0 012.25-2.25h1.383z" /></svg>, label: "Liked videos" },
    ];

    return (
        <aside
            className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] z-40 bg-zinc-900 w-60 transition-transform duration-300 transform ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 overflow-y-auto px-2 pb-4 border-r border-zinc-800`}
        >
            <div className="p-2">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center justify-between w-full p-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700"
                    aria-expanded={isMenuOpen}
                >
                    <span className="font-semibold">Menu</span>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-screen' : 'max-h-0'}`}>
                    <div className="pt-2">
                        <nav className="flex flex-col space-y-1">
                            {mainNavItems.map(item => <NavItem key={item.label} to={item.to} icon={item.icon} label={item.label} />)}
                        </nav>
                        <div className="border-t border-zinc-700 my-4"></div>
                        <nav className="flex flex-col space-y-1">
                            {secondaryNavItems.map(item => <NavItem key={item.label} to={item.to} icon={item.icon} label={item.label} />)}
                        </nav>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;