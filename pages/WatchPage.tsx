import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { AuthContext } from '../App';
import type { Video, Comment } from '../types';
import { timeAgo, formatViews, MOCK_VIDEOS } from '../constants';
import VideoCard from '../components/VideoCard';

const WatchPage: React.FC = () => {
    const [video, setVideo] = useState<Video | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newComment, setNewComment] = useState('');
    
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const fetchVideo = async () => {
            try {
                const videoRef = doc(db, 'videos', id);
                const videoSnap = await getDoc(videoRef);

                if (videoSnap.exists()) {
                    const videoData = { 
                        id: videoSnap.id, 
                        ...videoSnap.data() 
                    } as Video;
                    setVideo({
                        ...videoData,
                        uploadedAt: timeAgo(videoData.createdAt),
                        views: (videoData.views || 0),
                        channelName: videoData.uploaderName,
                        channelAvatarUrl: videoData.uploaderAvatarUrl || `https://picsum.photos/seed/${videoData.uploaderId}/40/40`,
                    });
                    
                    // Increment views in Firestore
                    await updateDoc(videoRef, {
                        views: increment(1)
                    });
                } else {
                    setError('Video not found.');
                }
            } catch (err) {
                console.error("Error fetching video:", err);
                setError('Failed to load video.');
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        
        const commentsQuery = query(collection(db, `videos/${id}/comments`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                postedAt: timeAgo(doc.data().createdAt),
            })) as Comment[];
            setComments(commentsData);
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        setRelatedVideos(MOCK_VIDEOS.filter(v => v.id !== id).slice(0, 10));
    }, [id]);
    
    const handleLike = async () => {
        if (!user || !id || !video) return;
        const videoRef = doc(db, 'videos', id);
        
        const currentlyLiked = video.likes.includes(user.uid);

        try {
            if (currentlyLiked) {
                // Unlike
                await updateDoc(videoRef, { likes: arrayRemove(user.uid) });
                setVideo(prev => prev ? ({...prev, likes: prev.likes.filter(uid => uid !== user.uid)}) : null);
            } else {
                // Like
                await updateDoc(videoRef, { likes: arrayUnion(user.uid) });
                setVideo(prev => prev ? ({...prev, likes: [...prev.likes, user.uid]}) : null);
            }
        } catch(e) {
            console.error("Error updating likes", e);
        }
    };
    
    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !id || !newComment.trim()) return;

        try {
            await addDoc(collection(db, `videos/${id}/comments`), {
                text: newComment,
                authorId: user.uid,
                authorName: user.displayName,
                authorAvatarUrl: user.photoURL,
                createdAt: serverTimestamp(),
                likes: 0,
            });
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    };
    
    if (loading) return <div className="text-center p-10">Loading...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!video) return <div className="text-center p-10">Video not found.</div>;

    const isLiked = user ? video.likes.includes(user.uid) : false;

    return (
        <div className="flex flex-col lg:flex-row max-w-screen-2xl mx-auto p-4 gap-4">
            <div className="flex-grow lg:w-2/3">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video src={video.videoUrl} controls autoPlay className="w-full h-full"></video>
                </div>
                <div className="py-4">
                    <h1 className="text-xl font-bold">{video.title}</h1>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 text-zinc-400">
                        <div className="flex items-center space-x-4">
                           <img src={video.channelAvatarUrl} alt={video.channelName} className="h-10 w-10 rounded-full" />
                           <div>
                                <div className="font-semibold text-white">{video.channelName}</div>
                           </div>
                           <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold">Subscribe</button>
                        </div>
                        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                            <div className="flex items-center bg-zinc-800 rounded-full">
                                <button onClick={handleLike} className={`px-4 py-2 flex items-center space-x-2 hover:bg-zinc-700 rounded-l-full ${isLiked ? 'text-blue-400' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                                    <span>{video.likes.length}</span>
                                </button>
                                <div className="w-px h-6 bg-zinc-600"></div>
                                <button className="px-4 py-2 hover:bg-zinc-700 rounded-r-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.642a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l2.4-4.8a4 4 0 00.8-2.4z" /></svg>
                                </button>
                            </div>
                            <button className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                                <span>Share</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-800 p-4 rounded-lg mt-4 text-sm">
                    <div className="font-bold">{formatViews(video.views)} &bull; {video.uploadedAt}</div>
                    <p className="whitespace-pre-wrap mt-2">{video.description}</p>
                </div>
                
                <div className="mt-6">
                    <h2 className="text-lg font-bold mb-4">{comments.length} Comments</h2>
                    { user && (
                        <form onSubmit={handleCommentSubmit} className="flex items-start space-x-4 mb-6">
                            <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="Your avatar" className="h-10 w-10 rounded-full" />
                            <div className="flex-1">
                                <input 
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..." 
                                    className="w-full bg-transparent border-b border-zinc-600 focus:border-white focus:outline-none pb-1"
                                />
                                 <div className="flex justify-end space-x-4 mt-2">
                                     <button type="button" onClick={() => setNewComment('')} className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-zinc-800">Cancel</button>
                                     <button type="submit" disabled={!newComment.trim()} className="px-4 py-2 text-sm font-semibold rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-400">Comment</button>
                                 </div>
                            </div>
                        </form>
                    )}
                    <div className="space-y-6">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex items-start space-x-4">
                                <img src={comment.authorAvatarUrl} alt={comment.authorName} className="h-10 w-10 rounded-full" />
                                <div>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="font-semibold text-sm">{comment.authorName}</span>
                                        <span className="text-xs text-zinc-400">{comment.postedAt}</span>
                                    </div>
                                    <p className="text-sm mt-1">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="lg:w-1/3 lg:max-w-sm flex-shrink-0">
                <h3 className="text-lg font-bold mb-4">Up next</h3>
                <div className="space-y-4">
                    {relatedVideos.map(relatedVideo => (
                        <VideoCard key={relatedVideo.id} video={relatedVideo} isVertical={false} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WatchPage;
