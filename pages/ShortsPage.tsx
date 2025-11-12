import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { AuthContext } from '../App';
import type { Video } from '../types';
import { timeAgo, formatViews, ThumbsDownIcon, CommentIcon, ShareIcon, ThreeDotsIcon } from '../constants';

const ShortsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext);

    const [video, setVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDescription, setShowDescription] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const fetchVideo = async () => {
            try {
                const videoRef = doc(db, 'videos', id);
                const videoSnap = await getDoc(videoRef);

                if (videoSnap.exists()) {
                    const videoData = { id: videoSnap.id, ...videoSnap.data() } as Video;
                    setVideo({
                        ...videoData,
                        uploadedAt: timeAgo(videoData.createdAt),
                        views: (videoData.views || 0) + 1, // Increment views on load
                        likes: videoData.likes || [],
                        dislikes: videoData.dislikes || [],
                        channelName: videoData.uploaderName,
                        channelAvatarUrl: videoData.uploaderAvatarUrl || `https://picsum.photos/seed/${videoData.uploaderId}/40/40`,
                    });
                     await updateDoc(videoRef, { views: increment(1) });
                } else {
                    setError('Short not found.');
                }
            } catch (err) {
                console.error("Error fetching short:", err);
                setError('Failed to load short.');
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [id]);
    
    const handleLikeDislike = async (action: 'like' | 'dislike') => {
        if (!user || !id || !video) return;
        const videoRef = doc(db, 'videos', id);
        
        const isLiked = video.likes.includes(user.uid);
        const isDisliked = video.dislikes.includes(user.uid);
        
        let newLikes = [...video.likes];
        let newDislikes = [...video.dislikes];

        if (action === 'like') {
            if (isLiked) newLikes = newLikes.filter(uid => uid !== user.uid);
            else {
                newLikes.push(user.uid);
                if (isDisliked) newDislikes = newDislikes.filter(uid => uid !== user.uid);
            }
        } else {
            if (isDisliked) newDislikes = newDislikes.filter(uid => uid !== user.uid);
            else {
                newDislikes.push(user.uid);
                if (isLiked) newLikes = newLikes.filter(uid => uid !== user.uid);
            }
        }
        
        try {
            await updateDoc(videoRef, { likes: newLikes, dislikes: newDislikes });
            setVideo(prev => prev ? ({...prev, likes: newLikes, dislikes: newDislikes}) : null);
        } catch(e) { console.error("Error updating reaction", e); }
    };

    if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;
    if (error) return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
    if (!video) return <div className="flex items-center justify-center h-full">Short not found.</div>;
    
    const isLiked = user ? video.likes.includes(user.uid) : false;
    const isDisliked = user ? video.dislikes.includes(user.uid) : false;

    return (
        <div className="h-full w-full flex justify-center items-center bg-black">
            <div className="relative h-[calc(100vh-3.5rem)] max-h-[900px] w-full max-w-[500px] rounded-2xl overflow-hidden">
                <video src={video.videoUrl} poster={video.thumbnailUrl} controls autoPlay loop className="h-full w-full object-contain"></video>
                
                <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center space-x-3">
                        <img src={video.channelAvatarUrl} alt={video.channelName} className="w-10 h-10 rounded-full" />
                        <div>
                            <p className="font-semibold">@{video.channelName}</p>
                            <button className="bg-white text-black px-3 py-1.5 rounded-full text-sm font-semibold mt-1">Subscribe</button>
                        </div>
                    </div>
                    <p className="mt-2 text-sm">{video.title}</p>
                </div>

                <div className="absolute bottom-4 right-4 flex flex-col items-center space-y-4 text-white">
                     <button onClick={() => handleLikeDislike('like')} className="flex flex-col items-center space-y-1">
                        <svg className={`h-7 w-7 ${isLiked ? 'text-blue-400' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                        <span className="text-xs font-semibold">{formatViews(video.likes.length)}</span>
                    </button>
                    <button onClick={() => handleLikeDislike('dislike')} className="flex flex-col items-center space-y-1">
                        <ThumbsDownIcon className={`h-7 w-7 ${isDisliked ? 'text-blue-400' : ''}`} />
                        <span className="text-xs font-semibold">Dislike</span>
                    </button>
                    <button className="flex flex-col items-center space-y-1">
                        <CommentIcon className="h-7 w-7" />
                        <span className="text-xs font-semibold">...</span>
                    </button>
                    <button className="flex flex-col items-center space-y-1">
                        <ShareIcon className="h-7 w-7" />
                        <span className="text-xs font-semibold">Share</span>
                    </button>
                    <button onClick={() => setShowDescription(true)} className="flex flex-col items-center space-y-1">
                        <ThreeDotsIcon className="h-7 w-7" />
                    </button>
                </div>
                
                {showDescription && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowDescription(false)}>
                        <div className="bg-zinc-800 rounded-lg p-6 w-11/12 max-w-md" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg">Description</h3>
                                <button onClick={() => setShowDescription(false)} className="text-2xl">&times;</button>
                            </div>
                            <div className="border-t border-zinc-700 my-3"></div>
                            <div className="space-y-4 text-sm">
                               <p>{video.description || "No description provided."}</p>
                               <div className="grid grid-cols-3 gap-4 text-center">
                                   <div>
                                       <p className="font-bold text-base">{formatViews(video.likes.length)}</p>
                                       <p className="text-xs text-zinc-400">Likes</p>
                                   </div>
                                   <div>
                                       <p className="font-bold text-base">{formatViews(video.views)}</p>
                                       <p className="text-xs text-zinc-400">Views</p>
                                   </div>
                                   <div>
                                       <p className="font-bold text-base">{new Date(video.createdAt.toDate()).toLocaleDateString()}</p>
                                       <p className="text-xs text-zinc-400">Uploaded</p>
                                   </div>
                               </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShortsPage;
