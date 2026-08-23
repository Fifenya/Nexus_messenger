import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export interface UploadedAttachment {
  url: string;
  type: 'image' | 'video' | 'voice' | 'file';
  size?: number;
  mimeType?: string;
}

async function uploadFile(uri: string, name: string, mimeType: string): Promise<UploadedAttachment> {
  const token = await AsyncStorage.getItem('nexus_token');
  const form = new FormData();
  // @ts-expect-error React Native's FormData file shape isn't in the DOM types
  form.append('file', { uri, name, type: mimeType });

  const res = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed (${res.status}): ${body}`);
  }

  return res.json();
}

/** Opens the photo/video picker and uploads the chosen file. Returns null if the user cancels. */
export async function pickAndUploadMedia(mediaType: MediaType = 'mixed'): Promise<UploadedAttachment | null> {
  const result = await launchImageLibrary({ mediaType, quality: 0.8, videoQuality: 'medium' });
  if (result.didCancel || !result.assets?.length) return null;

  const asset = result.assets[0];
  if (!asset.uri) return null;

  return uploadFile(asset.uri, asset.fileName || `media_${Date.now()}`, asset.type || 'application/octet-stream');
}

/** Opens the camera and uploads the captured photo/video. Returns null if the user cancels. */
export async function captureAndUploadMedia(mediaType: MediaType = 'photo'): Promise<UploadedAttachment | null> {
  const result = await launchCamera({ mediaType, quality: 0.8, videoQuality: 'medium', saveToPhotos: true });
  if (result.didCancel || !result.assets?.length) return null;

  const asset = result.assets[0];
  if (!asset.uri) return null;

  return uploadFile(asset.uri, asset.fileName || `capture_${Date.now()}`, asset.type || 'application/octet-stream');
}

/** Uploads an already-recorded local file (used for voice messages). */
export async function uploadLocalFile(uri: string, name: string, mimeType: string) {
  return uploadFile(uri, name, mimeType);
}
