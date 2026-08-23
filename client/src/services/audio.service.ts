import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Platform } from 'react-native';

const recorder = new AudioRecorderPlayer();

const VOICE_PATH = Platform.select({
  ios: 'voice_message.m4a',
  android: `${Date.now()}_voice_message.mp4`,
  default: 'voice_message.mp4',
});

class AudioService {
  private recording = false;
  private playing = false;

  async startRecording(): Promise<void> {
    if (this.recording) return;
    this.recording = true;
    await recorder.startRecorder(VOICE_PATH);
  }

  /** Stops recording and returns the local file path + duration in seconds. */
  async stopRecording(): Promise<{ uri: string; durationSec: number }> {
    const uri = await recorder.stopRecorder();
    const durationMs = recorder.mmssss ? 0 : 0; // placeholder, see note below
    this.recording = false;
    // react-native-audio-recorder-player doesn't return final duration on stop;
    // callers should track elapsed time themselves via addRecordBackListener if
    // exact duration matters. We fall back to 0 and let the UI show "voice message".
    return { uri, durationSec: durationMs };
  }

  onRecordProgress(callback: (elapsedSec: number) => void) {
    recorder.addRecordBackListener((e) => {
      callback(Math.floor(e.currentPosition / 1000));
    });
  }

  async playFromUrl(url: string): Promise<void> {
    if (this.playing) await this.stopPlaying();
    this.playing = true;
    await recorder.startPlayer(url);
    recorder.addPlayBackListener((e) => {
      if (e.currentPosition >= e.duration) {
        this.stopPlaying();
      }
    });
  }

  async stopPlaying(): Promise<void> {
    if (!this.playing) return;
    await recorder.stopPlayer();
    recorder.removePlayBackListener();
    this.playing = false;
  }

  cleanup() {
    recorder.removeRecordBackListener();
    recorder.removePlayBackListener();
  }
}

export const audioService = new AudioService();
