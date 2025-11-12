import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  
  uploaderId: string;
  uploaderName: string;
  uploaderAvatarUrl: string;
  
  createdAt: Timestamp;
  
  // Dynamic fields
  views: number;
  likes: string[]; // Array of user IDs who liked the video
  
  // For display purposes, to be formatted
  uploadedAt: string; 
  duration?: string;
  channelName?: string; // a.k.a uploaderName
  channelAvatarUrl?: string; // a.k.a uploaderAvatarUrl
  isShort?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  createdAt: Timestamp;
  likes: number;
  
  // For display purposes
  postedAt: string;
}

export interface AppUser extends FirebaseUser {
    isAdmin?: boolean;
}