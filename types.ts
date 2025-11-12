import { User as FirebaseUser } from 'firebase/auth';

export interface Video {
  id: string;
  thumbnailUrl: string;
  title: string;
  channelName: string;
  channelAvatarUrl: string;
  views: string;
  uploadedAt: string;
  duration: string;
  videoUrl?: string;
  description?: string;
}

export interface Comment {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  likes: number;
  postedAt: string;
  replies?: Comment[];
}

export interface AppUser extends FirebaseUser {
    isAdmin?: boolean;
}
