import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface AppUser extends User {
    isAdmin: boolean;
}

export interface Video {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: string;
    views: number;
    likes: string[]; // array of user uids
    dislikes: string[]; // array of user uids
    isShort?: boolean;
    channelName: string;
    channelAvatarUrl: string;
    uploadedAt: string; // Formatted string like "2 days ago"
    createdAt: Timestamp; // Firestore Timestamp
    uploaderId: string;
    uploaderName: string;
    uploaderAvatarUrl?: string;
}

export interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string;
    createdAt: Timestamp; // Firestore Timestamp
    postedAt: string; // Formatted string like "2 days ago"
    likes: number;
}
