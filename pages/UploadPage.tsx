import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { storage, db } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const UploadPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!videoFile || !title || !user) {
            setError('Please select a video file and provide a title.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setProgress(0);

        const storageRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, videoFile);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(currentProgress);
            },
            (error) => {
                console.error("Upload error:", error);
                setError('Failed to upload video. Please try again.');
                setIsUploading(false);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    await addDoc(collection(db, "videos"), {
                        videoUrl: downloadURL,
                        title: title,
                        description: description,
                        uploaderId: user.uid,
                        uploaderName: user.displayName,
                        uploaderAvatarUrl: user.photoURL,
                        createdAt: serverTimestamp(),
                        // Using a placeholder for thumbnail as client-side generation is complex
                        thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`,
                    });

                    setIsUploading(false);
                    navigate('/'); // Navigate to home page after successful upload
                } catch (dbError) {
                    console.error("Firestore error:", dbError);
                    setError('Failed to save video metadata.');
                    setIsUploading(false);
                }
            }
        );
    };

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Upload Video</h1>
            <div className="bg-zinc-800 p-6 rounded-lg space-y-6">
                <div>
                    <label htmlFor="videoFile" className="block text-sm font-medium text-zinc-300 mb-2">Video File</label>
                    <input
                        id="videoFile"
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700"
                        disabled={isUploading}
                    />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title"
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
                        disabled={isUploading}
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell viewers about your video"
                        rows={4}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
                        disabled={isUploading}
                    />
                </div>
                
                {isUploading && (
                    <div className="w-full">
                        <div className="w-full bg-zinc-700 rounded-full h-2.5">
                            <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-center text-sm mt-2">{Math.round(progress)}%</p>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !videoFile || !title}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-full transition-colors"
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;