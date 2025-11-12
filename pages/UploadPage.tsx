import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { db, storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const UploadPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [isShort, setIsShort] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';
            videoElement.onloadedmetadata = () => {
                window.URL.revokeObjectURL(videoElement.src);
                const duration = videoElement.duration;
                setVideoDuration(duration);
                setIsShort(duration <= 16);
            };
            videoElement.src = URL.createObjectURL(file);
        }
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setThumbnailFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !videoFile || !thumbnailFile || !title) {
            setError('Please fill all required fields and select files.');
            return;
        }

        setUploading(true);
        setError('');
        setProgress(0);

        try {
            // 1. Upload video file
            const videoRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
            const videoUploadTask = uploadBytesResumable(videoRef, videoFile);

            videoUploadTask.on('state_changed', 
                (snapshot) => {
                    const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setProgress(prog / 2); // Video is first half
                }
            );
            await videoUploadTask;
            const videoUrl = await getDownloadURL(videoUploadTask.snapshot.ref);
            
            // 2. Upload thumbnail file
            const thumbnailRef = ref(storage, `thumbnails/${Date.now()}_${thumbnailFile.name}`);
            const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, thumbnailFile);
            
            thumbnailUploadTask.on('state_changed', 
                (snapshot) => {
                    const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setProgress(50 + (prog / 2)); // Thumbnail is second half
                }
            );
            await thumbnailUploadTask;
            const thumbnailUrl = await getDownloadURL(thumbnailUploadTask.snapshot.ref);
            
            const minutes = Math.floor(videoDuration / 60);
            const seconds = Math.floor(videoDuration % 60);
            const formattedDuration = `${minutes}:${String(seconds).padStart(2, '0')}`;

            // 3. Add video metadata to Firestore
            await addDoc(collection(db, 'videos'), {
                title,
                description,
                videoUrl,
                thumbnailUrl,
                uploaderId: user.uid,
                uploaderName: user.displayName,
                uploaderAvatarUrl: user.photoURL,
                views: 0,
                likes: [],
                dislikes: [],
                isShort: isShort,
                duration: formattedDuration, 
                createdAt: serverTimestamp()
            });

            setUploading(false);
            navigate('/');

        } catch (err) {
            console.error("Upload failed: ", err);
            setError('Upload failed. Please try again.');
            setUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6">Upload Video</h1>
            <form onSubmit={handleUpload} className="space-y-6 bg-zinc-800 p-8 rounded-lg">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 focus:outline-none focus:border-red-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                    <textarea
                        id="description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 focus:outline-none focus:border-red-500"
                    />
                </div>
                <div>
                    <label htmlFor="video-file" className="block text-sm font-medium text-zinc-300 mb-2">Video File</label>
                    <input
                        type="file"
                        id="video-file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-600 file:text-zinc-200 hover:file:bg-zinc-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="thumbnail-file" className="block text-sm font-medium text-zinc-300 mb-2">Thumbnail Image</label>
                    <input
                        type="file"
                        id="thumbnail-file"
                        accept="image/*"
                        onChange={handleThumbnailFileChange}
                        className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-600 file:text-zinc-200 hover:file:bg-zinc-500"
                        required
                    />
                </div>
                 <div className="flex items-center">
                    <input
                      id="is-short"
                      type="checkbox"
                      checked={isShort}
                      onChange={(e) => setIsShort(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="is-short" className="ml-2 block text-sm text-zinc-300">
                      This video is a Short (auto-detected if &lt;= 16s)
                    </label>
                </div>
                {uploading && (
                    <div>
                        <p className="text-sm text-center mb-2">Uploading... {Math.round(progress)}%</p>
                        <div className="w-full bg-zinc-700 rounded-full h-2.5">
                            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UploadPage;