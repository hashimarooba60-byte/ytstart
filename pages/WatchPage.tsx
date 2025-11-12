import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_VIDEOS, timeAgo, formatViews } from '../constants';
import VideoCard from '../components/VideoCard';
import type { Video, Comment as CommentType } from '../types';
import { AuthContext } from '../App';
import { db } from '../services/firebase';
// fix: Import 'where' from 'firebase/firestore' to resolve 'Cannot find name' error.
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, getDocs, where } from 'firebase/firestore';


const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => (
    <div className="flex items-start space-x-3">
        <img src={comment.authorAvatarUrl} alt={comment.authorName} className="w-10 h-10 rounded-full"/>
        <div>
            <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{comment.authorName}</span>
                <span className="text-xs text-zinc-400">{comment.postedAt}</span>
            </div>
            <p className="text-sm mt-1">{comment.text}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs">
                <button className="flex items-center space-x-1 hover:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    <span>{comment.likes}</span>
                </button>
                 <button className="font-semibold hover:text-red-400">REPLY</button>
            </div>
        </div>
    </div>
);


const WatchPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext);

    const [video, setVideo] = useState<Video | null>(null);
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLiked, setIsLiked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);

    const recommendedVideos = MOCK_VIDEOS.filter(v => v.id !== id).slice(0, 10);

    // Fetch video data
    useEffect(() => {
        if (!id) return;
        const videoRef = doc(db, 'videos', id);
        
        const getVideo = async () => {
            const videoSnap = await getDoc(videoRef);
            if (videoSnap.exists()) {
                const videoData = videoSnap.data() as Video;
                setVideo({ 
                    ...videoData, 
                    id: videoSnap.id,
                    uploadedAt: timeAgo(videoData.createdAt),
                });
                if(user) {
                    setIsLiked(videoData.likes.includes(user.uid));
                }
            } else {
                console.log("No such video!");
            }
        };
        getVideo();
    }, [id, user]);
    
    // Fetch comments
    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, `videos/${id}/comments`), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const commentsData: CommentType[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                postedAt: timeAgo(doc.data().createdAt),
            } as CommentType));
            setComments(commentsData);
        });
        return () => unsubscribe();
    }, [id]);
    
    // Check subscription status & get sub count
    useEffect(() => {
        if (!user || !video) return;
        const subRef = doc(db, `subscriptions/${video.uploaderId}_${user.uid}`);
        const getSubscription = async () => {
            const subSnap = await getDoc(subRef);
            setIsSubscribed(subSnap.exists());
        };
        getSubscription();

        const subsQuery = query(collection(db, 'subscriptions'), where('channelId', '==', video.uploaderId));
        const getSubCount = async () => {
            const querySnapshot = await getDocs(subsQuery);
            setSubscriberCount(querySnapshot.size);
        }
        getSubCount();

    }, [user, video]);

    const handleCommentSubmit = async () => {
        if (!newComment.trim() || !user || !id) return;
        await addDoc(collection(db, `videos/${id}/comments`), {
            authorId: user.uid,
            authorName: user.displayName,
            authorAvatarUrl: user.photoURL,
            text: newComment,
            createdAt: serverTimestamp(),
            likes: 0
        });
        setNewComment("");
    };
    
    const handleLike = async () => {
        if (!user || !id) return;
        const videoRef = doc(db, 'videos', id);
        await updateDoc(videoRef, {
            likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
        setIsLiked(!isLiked);
        // Optimistic UI update
        if (video) {
            const currentLikes = video.likes.length;
            setVideo({...video, likes: isLiked ? video.likes.filter(uid => uid !== user.uid) : [...video.likes, user.uid]});
        }
    };
    
    const handleSubscribe = async () => {
        if (!user || !video) return;
        const subRef = doc(db, `subscriptions/${video.uploaderId}_${user.uid}`);
        if(isSubscribed) {
            await deleteDoc(subRef);
            setSubscriberCount(prev => prev - 1);
        } else {
            await setDoc(subRef, {
                channelId: video.uploaderId,
                subscriberId: user.uid,
                createdAt: serverTimestamp()
            });
            setSubscriberCount(prev => prev + 1);
        }
        setIsSubscribed(!isSubscribed);
    };

    if (!video) return <div className="text-center p-10">Loading video...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
            {/* Main Content */}
            <div className="flex-grow lg:w-2/3">
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    <video src={video.videoUrl} controls autoPlay className="w-full h-full object-cover">
                        Your browser does not support the video tag.
                    </video>
                </div>

                <h1 className="text-xl font-bold mt-4">{video.title}</h1>

                <div className="flex flex-wrap items-center justify-between mt-4">
                    <div className="flex items-center space-x-3">
                        <img src={video.uploaderAvatarUrl} alt={video.uploaderName} className="w-10 h-10 rounded-full" />
                        <div>
                            <div className="font-semibold">{video.uploaderName}</div>
                            <div className="text-sm text-zinc-400">{subscriberCount} subscribers</div>
                        </div>
                         <button onClick={handleSubscribe} disabled={!user || user.uid === video.uploaderId} className={`font-semibold px-4 py-2 rounded-full ml-4 ${isSubscribed ? 'bg-zinc-700 text-white' : 'bg-white text-black'} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
                            {isSubscribed ? 'Subscribed' : 'Subscribe'}
                        </button>
                    </div>

                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <button onClick={handleLike} disabled={!user} className={`flex items-center bg-zinc-800 hover:bg-zinc-700 rounded-full px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed ${isLiked ? 'bg-red-500/20 text-red-400' : ''}`}>
                             <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                            {video.likes.length}
                        </button>
                        <button className="bg-zinc-800 hover:bg-zinc-700 rounded-full px-4 py-2">Share</button>
                        <button className="bg-zinc-800 hover:bg-zinc-700 rounded-full px-4 py-2">Download</button>
                    </div>
                </div>
                
                <div className="bg-zinc-800 p-4 rounded-xl mt-4">
                    <p className="font-semibold text-sm">{formatViews(video.views)} &bull; {video.uploadedAt}</p>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{video.description}</p>
                </div>

                {/* Comments Section */}
                <div className="mt-6">
                    <h2 className="text-lg font-bold mb-4">{comments.length} Comments</h2>
                     <div className="flex items-start space-x-3 mb-6">
                        {user ? (
                           <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="Your avatar" className="w-10 h-10 rounded-full" />
                        ) : (
                           <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                           </div>
                        )}
                        <div className="w-full">
                            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full bg-transparent border-b-2 border-zinc-700 focus:border-white focus:outline-none py-1" disabled={!user}/>
                            {newComment && user && (
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button onClick={() => setNewComment('')} className="px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-zinc-700">Cancel</button>
                                    <button onClick={handleCommentSubmit} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-500 hover:bg-blue-600">Comment</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-6">
                        {comments.map(comment => <Comment key={comment.id} comment={comment} />)}
                    </div>
                </div>

            </div>

            {/* Recommended Videos */}
            <div className="lg:w-1/3 lg:max-w-sm flex-shrink-0">
                <div className="space-y-4">
                    {recommendedVideos.map(recVideo => (
                        <VideoCard key={recVideo.id} video={recVideo} isVertical={false} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WatchPage;