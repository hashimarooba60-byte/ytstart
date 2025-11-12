import React from 'react';
import VideoCard from '../components/VideoCard';
import { MOCK_VIDEOS } from '../constants';

const HomePage: React.FC = () => {
    // In a real app, you'd fetch this data from Firebase
    const videos = MOCK_VIDEOS;
    const categories = ["All", "Music", "Gaming", "Live", "React", "Comedy", "Programming", "Trailers", "News", "Sports"];

    return (
        <div className="p-4 md:p-6">
             <div className="sticky top-14 bg-zinc-900/95 py-2 -mx-4 px-4 md:-mx-6 md:px-6 mb-4 backdrop-blur-sm z-30">
                <div className="flex space-x-3 overflow-x-auto pb-2 -mb-2">
                    {categories.map((category) => (
                        <button key={category} className="px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors focus:bg-white focus:text-black">
                            {category}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                {videos.map(video => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>
        </div>
    );
};

export default HomePage;
