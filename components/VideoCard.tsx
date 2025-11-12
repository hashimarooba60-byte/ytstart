import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../types';
import { formatViews } from '../constants';

interface VideoCardProps {
    video: Video;
    isVertical?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isVertical = true }) => {
    // Horizontal card for "Up next" list
    if (!isVertical) {
        return (
            <Link to={`/watch/${video.id}`} className="flex space-x-3 group">
                <div className="flex-shrink-0 w-40 h-24 relative">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover rounded-lg" />
                     <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">{video.duration}</span>
                </div>
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-red-400 line-clamp-2">{video.title}</h3>
                    <div className="text-xs text-zinc-400 mt-1">{video.channelName}</div>
                    <div className="text-xs text-zinc-400">{formatViews(video.views)} &bull; {video.uploadedAt}</div>
                </div>
            </Link>
        )
    }
    
    // Vertical card for Shorts
    if (video.isShort) {
        return (
            <Link to={`/watch/${video.id}`} className="flex flex-col space-y-2 group w-48">
                <div className="relative">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full object-cover rounded-xl aspect-[9/16]" />
                </div>
                <div>
                    <h3 className="text-md font-semibold text-white leading-snug group-hover:text-red-400 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-zinc-400">{formatViews(video.views)}</p>
                </div>
            </Link>
        );
    }

    // Default vertical card for main grid
    return (
        <Link to={`/watch/${video.id}`} className="flex flex-col space-y-2 group">
            <div className="relative">
                <img src={video.thumbnailUrl} alt={video.title} className="w-full object-cover rounded-xl aspect-video" />
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">{video.duration}</span>
            </div>
            <div className="flex items-start space-x-3">
                <img src={video.channelAvatarUrl} alt={video.channelName} className="h-9 w-9 rounded-full" />
                <div>
                    <h3 className="text-md font-semibold text-white leading-snug group-hover:text-red-400 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{video.channelName}</p>
                    <p className="text-sm text-zinc-400">{formatViews(video.views)} &bull; {video.uploadedAt}</p>
                </div>
            </div>
        </Link>
    );
};

export default VideoCard;