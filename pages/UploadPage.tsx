import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { db, storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const UploadPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setThumbnailFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!videoFile || !thumbnailFile || !title.trim() || !user) {
            setError('Please fill all fields and select both a video and a thumbnail file.');
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadProgress(0);

        // We'll upload thumbnail first, then video, then write to firestore.
        // This is a simpler flow than parallel uploads.
        const thumbnailStorageRef = ref(storage, `thumbnails/${Date.now()}-${thumbnailFile.name}`);
        const thumbnailUploadTask = uploadBytesResumable(thumbnailStorageRef, thumbnailFile);

        thumbnailUploadTask.on('state_changed', 
            null, 
            (uploadError) => {
                console.error('Thumbnail upload failed:', uploadError);
                setError('Failed to upload thumbnail. Please try again.');
                setIsUploading(false);
            },
            async () => {
                const thumbnailUrl = await getDownloadURL(thumbnailUploadTask.snapshot.ref);

                const videoStorageRef = ref(storage, `videos/${Date.now()}-${videoFile.name}`);
                const videoUploadTask = uploadBytesResumable(videoStorageRef, videoFile);

                videoUploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (uploadError) => {
                        console.error('Video upload failed:', uploadError);
                        setError('Failed to upload video. Please try again.');
                        setIsUploading(false);
                    },
                    async () => {
                        const videoUrl = await getDownloadURL(videoUploadTask.snapshot.ref);
                        try {
                            await addDoc(collection(db, 'videos'), {
                                title,
                                description,
                                videoUrl,
                                thumbnailUrl,
                                uploaderId: user.uid,
                                uploaderName: user.displayName || 'Anonymous',
                                uploaderAvatarUrl: user.photoURL || '',
                                createdAt: serverTimestamp(),
                                views: 0,
                                likes: [],
                            });
                            
                            setIsUploading(false);
                            navigate('/');
                        } catch (dbError) {
                            console.error('Error adding document: ', dbError);
                            setError('Failed to save video details. Please try again.');
                            setIsUploading(false);
                        }
                    }
                );
            }
        );
    };

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-6 text-white">
            <h1 className="text-3xl font-bold mb-6">Upload Video</h1>
            <div className="bg-zinc-800 p-6 rounded-lg space-y-6">
                <div>
                    <label htmlFor="video-file" className="block text-sm font-medium text-zinc-300 mb-2">Video File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-zinc-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-zinc-400">
                                <label htmlFor="video-file" className="relative cursor-pointer bg-zinc-700 rounded-md font-medium text-red-400 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-zinc-800 focus-within:ring-red-500">
                                    <span>Upload a file</span>
                                    <input id="video-file" name="video-file" type="file" className="sr-only" accept="video/*" onChange={handleVideoFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-zinc-500">MP4, MOV, AVI up to 1GB</p>
                            {videoFile && <p className="text-sm text-green-400 mt-2">{videoFile.name}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="thumbnail-file" className="block text-sm font-medium text-zinc-300 mb-2">Thumbnail</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-600 border-dashed rounded-md">
                         <div className="space-y-1 text-center">
                             <svg className="mx-auto h-12 w-12 text-zinc-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                             <div className="flex text-sm text-zinc-400">
                                <label htmlFor="thumbnail-file" className="relative cursor-pointer bg-zinc-700 rounded-md font-medium text-red-400 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-zinc-800 focus-within:ring-red-500">
                                    <span>Upload an image</span>
                                    <input id="thumbnail-file" name="thumbnail-file" type="file" className="sr-only" accept="image/*" onChange={handleThumbnailFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-zinc-500">PNG, JPG, GIF up to 10MB</p>
                            {thumbnailFile && <p className="text-sm text-green-400 mt-2">{thumbnailFile.name}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500" placeholder="My Awesome Video" required />
                </div>
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500" placeholder="Tell viewers about your video"></textarea>
                </div>

                {isUploading && (
                    <div>
                        <p className="text-sm text-zinc-300 mb-2">Uploading...</p>
                        <div className="w-full bg-zinc-700 rounded-full h-2.5">
                            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                )}
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="flex justify-end pt-4">
                    <button onClick={handleUpload} disabled={isUploading || !videoFile || !thumbnailFile || !title} className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Publish'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
