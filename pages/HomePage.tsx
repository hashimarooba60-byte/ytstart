import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import { MOCK_VIDEOS, timeAgo, formatViews } from '../constants';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Video } from '../types';

const HomePage: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const categories = ["All", "Music", "Gaming", "Live", "React", "Comedy", "Programming", "Trailers", "News", "Sports"];

    useEffect(() => {
        const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const videosData: Video[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    uploadedAt: timeAgo(data.createdAt),
                    views: data.views || 0, // Use Firestore views or default to 0
                    channelName: data.uploaderName,
                    channelAvatarUrl: data.uploaderAvatarUrl || `https://picsum.photos/seed/${data.uploaderId}/40/40`,
                    duration: 'N/A', // Duration metadata requires more complex processing
                } as Video;
            });
            
            setVideos(videosData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching videos: ", error);
            setVideos(MOCK_VIDEOS); // Fallback to mocks on error
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatVideoCardViews = (video: Video) => {
      // Mocks might have string views, Firestore has numbers
      if (typeof video.views === 'string') return video.views;
      return formatViews(video.views);
    }

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
            {loading ? (
                 <div className="text-center py-10">Loading videos...</div>
            ) : videos.length === 0 ? (
                 <div className="text-center py-10 text-zinc-400">
                    <h2 className="text-xl font-semibold">No videos yet</h2>
                    <p>Be the first to upload a video!</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                    {videos.map(video => (
                        <VideoCard key={video.id} video={{...video, views: formatVideoCardViews(video)}} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;