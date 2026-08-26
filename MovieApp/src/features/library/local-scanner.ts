import { db } from "@/lib/db/dexie-db";
import { GUEST_USER_ID } from "@/types/storage";
import { formatBytes } from "@/lib/utils/formatters";
import { MetadataResolver } from "@/features/library/metadata-resolver";
import type { LocalScannedMediaRecord } from "@/types/storage";

export class LocalScannerService {
  private static supportedExtensions = [".mp4", ".mkv", ".webm", ".mov", ".avi", ".m4v", ".ts"];
  private static indexedBlobMap = new Map<string, File>();

  static isFSAccessSupported(): boolean {
    return typeof window !== "undefined" && "showDirectoryPicker" in window;
  }

  static async scanDirectory(): Promise<LocalScannedMediaRecord[]> {
    if (!this.isFSAccessSupported()) {
      return this.fallbackFileSelector();
    }

    try {
      const dirHandle = await (window as unknown as { showDirectoryPicker: (opts: unknown) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({
        mode: "read",
        startIn: "downloads",
      });

      const discoveredFiles: Array<{ name: string; path: string; file: File; sizeBytes: number }> = [];
      await this.traverseDirectoryHandle(dirHandle, "", discoveredFiles);
      return await this.processDiscoveredFiles(discoveredFiles);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return [];
      }
      return this.fallbackFileSelector();
    }
  }

  private static async traverseDirectoryHandle(
    dirHandle: FileSystemDirectoryHandle,
    currentPath: string,
    accumulator: Array<{ name: string; path: string; file: File; sizeBytes: number }>
  ) {
    for await (const entry of (dirHandle as unknown as AsyncIterable<FileSystemHandle>)) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.kind === "file") {
        const extMatch = entry.name.match(/\.([a-z0-9]+)$/i);
        if (extMatch && this.supportedExtensions.includes(`.${extMatch[1].toLowerCase()}`)) {
          const fileObj = await (entry as FileSystemFileHandle).getFile();
          accumulator.push({
            name: entry.name,
            path: entryPath,
            file: fileObj,
            sizeBytes: fileObj.size,
          });
        }
      } else if (entry.kind === "directory") {
        await this.traverseDirectoryHandle(entry as FileSystemDirectoryHandle, entryPath, accumulator);
      }
    }
  }

  private static fallbackFileSelector(): Promise<LocalScannedMediaRecord[]> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      (input as unknown as { webkitdirectory: boolean }).webkitdirectory = true;
      (input as unknown as { directory: boolean }).directory = true;
      input.multiple = true;
      input.style.display = "none";

      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        const validFiles = files
          .filter((f) => {
            const extMatch = f.name.match(/\.([a-z0-9]+)$/i);
            return extMatch && this.supportedExtensions.includes(`.${extMatch[1].toLowerCase()}`);
          })
          .map((f) => ({
            name: f.name,
            path: (f as unknown as { webkitRelativePath?: string }).webkitRelativePath || f.name,
            file: f,
            sizeBytes: f.size,
          }));

        document.body.removeChild(input);
        if (validFiles.length > 0) {
          const results = await this.processDiscoveredFiles(validFiles);
          resolve(results);
        } else {
          resolve([]);
        }
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  private static async processDiscoveredFiles(
    fileEntries: Array<{ name: string; path: string; file: File; sizeBytes: number }>
  ): Promise<LocalScannedMediaRecord[]> {
    const processedItems: LocalScannedMediaRecord[] = [];

    for (const entry of fileEntries) {
      const fingerprint = `fp_${entry.sizeBytes}_${entry.name.replace(/[^a-z0-9]/gi, "_")}`;

      // Check if existing mapping already confirmed in IndexedDB
      const existing = await db.localScannedMedia.filter((item) => item.fileFingerprint === fingerprint).first();

      if (existing && (existing.isUserOverridden || existing.matchStatus === "confirmed")) {
        this.indexedBlobMap.set(existing.downloadId, entry.file);
        processedItems.push(existing);
        continue;
      }

      // Execute Multi-Signal Resolution Pipeline
      const resolved = await MetadataResolver.resolveFileMetadata(entry.name, entry.path, entry.sizeBytes);
      const fileId = resolved.localMediaId;

      this.indexedBlobMap.set(fileId, entry.file);

      const record: LocalScannedMediaRecord = {
        downloadId: fileId,
        userId: GUEST_USER_ID,
        id: fileId,
        isLocalFile: true,
        fileFingerprint: fingerprint,
        title: resolved.canonicalTitle,
        canonicalTitle: resolved.canonicalTitle,
        year: resolved.year,
        mediaType: resolved.mediaType,
        season: resolved.season,
        episode: resolved.episode,
        quality: (MetadataResolver.parseFilename(entry.name)).quality,
        fullRelativePath: entry.path,
        fileName: entry.name,
        sizeBytes: entry.sizeBytes,
        sizeFormatted: formatBytes(entry.sizeBytes),
        poster_path: resolved.posterPath || "",
        overview: resolved.overview,
        status: "completed",
        progress: 100,
        matchConfidence: resolved.matchConfidence,
        matchStatus: resolved.matchStatus,
        candidates: resolved.candidates,
        isUserOverridden: false,
        createdAt: resolved.createdAt,
      };

      processedItems.push(record);
      await db.localScannedMedia.put(record);
    }

    return processedItems;
  }

  static getLocalFileBlobUrl(fileId: string): string | null {
    const file = this.indexedBlobMap.get(fileId);
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }

  static async overrideMatch(
    downloadId: string,
    candidate: { tmdbId: number; title: string; year: string; mediaType: "movie" | "tv"; posterPath?: string | null; overview?: string }
  ) {
    const item = await db.localScannedMedia.get(downloadId);
    if (item) {
      item.title = candidate.title;
      item.canonicalTitle = candidate.title;
      item.year = candidate.year;
      item.mediaType = candidate.mediaType;
      item.poster_path = candidate.posterPath || "";
      item.overview = candidate.overview;
      item.matchConfidence = 100;
      item.matchStatus = "confirmed";
      item.isUserOverridden = true;
      await db.localScannedMedia.put(item);
    }
  }
}
