import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import type { Video } from '../types';
import { timeAgo } from '../constants';

const HomePage: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            setError('');
            try {
                const videosCollection = collection(db, 'videos');
                const q = query(videosCollection, orderBy('createdAt', 'desc'), limit(50));
                const videoSnapshot = await getDocs(q);
                const videosList = videoSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        uploadedAt: timeAgo(data.createdAt),
                        channelName: data.uploaderName,
                        channelAvatarUrl: data.uploaderAvatarUrl || `https://picsum.photos/seed/${data.uploaderId}/40/40`,
                    } as Video
                });
                setVideos(videosList);
            } catch (err) {
                console.error("Error fetching videos: ", err);
                setError('Failed to load videos. Please try again later.');
            }
            setLoading(false);
        };

        fetchVideos();
    }, []);

    const shorts = videos.filter(v => v.isShort);
    const regularVideos = videos.filter(v => !v.isShort);
    
    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-10">Loading videos...</div>;
        }
        if (error) {
            return <div className="text-center p-10 text-red-500">{error}</div>;
        }
        if (videos.length === 0) {
            return <div className="text-center p-10">No videos found. Be the first to upload!</div>;
        }

        return (
            <>
                 {shorts.length > 0 && (
                    <>
                         <h2 className="text-xl font-bold mb-4 flex items-center">
                            <svg className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Shorts
                         </h2>
                         <div className="flex space-x-4 overflow-x-auto pb-4 mb-8 no-scrollbar">
                            {shorts.map(video => (
                                <div key={video.id} className="flex-shrink-0 w-40 sm:w-48 md:w-56">
                                    <VideoCard video={video} />
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-zinc-700 my-6"></div>
                    </>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                    {regularVideos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            </>
        )
    }

    return (
        <div className="p-4 md:p-6">
            {renderContent()}
        </div>
    );
};

export default HomePage;