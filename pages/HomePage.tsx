import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import { MOCK_VIDEOS } from '../constants';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Video } from '../types';

// Helper function to format Firestore Timestamps into a readable "time ago" string
const timeAgo = (timestamp: any): string => {
    if (!timestamp?.toDate) return 'just now';
    const date = timestamp.toDate();
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};

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
                    title: data.title,
                    description: data.description,
                    thumbnailUrl: data.thumbnailUrl,
                    videoUrl: data.videoUrl,
                    channelName: data.uploaderName,
                    channelAvatarUrl: data.uploaderAvatarUrl || `https://picsum.photos/seed/${data.uploaderId}/40/40`,
                    views: `${Math.floor(Math.random() * 1000)}K views`, // Mocking views
                    uploadedAt: timeAgo(data.createdAt),
                    duration: 'N/A', // Mocking duration
                } as Video;
            });
            
            // Combine fetched videos with mock videos for a fuller homepage
            const combinedVideos = [...videosData, ...MOCK_VIDEOS.filter(mock => !videosData.find(v => v.id === mock.id))];
            setVideos(combinedVideos);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching videos: ", error);
            setVideos(MOCK_VIDEOS); // Fallback to mocks on error
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
                 <p>Loading videos...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                    {videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;