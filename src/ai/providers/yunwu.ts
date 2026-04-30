import type {
  AIVideoProvider,
  VideoGenerationParams,
  VideoTaskResponse,
} from "../types";
import {
  getProviderModelId,
  transformParamsForProvider,
} from "../model-mapping";

/**
 * 云雾 Yunwu Provider (see100.net)
 *
 * API: https://api.see100.net/v1/video/create
 * Models: veo3.1-fast-components, veo3-fast-frames
 */
export class YunwuProvider implements AIVideoProvider {
  name = "yunwu";
  supportImageToVideo = true;
  private apiKey: string;
  private baseUrl = "https://api.see100.net";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createTask(params: VideoGenerationParams): Promise<VideoTaskResponse> {
    const internalModelId = params.model || "veo3.1-fast-components";
    const providerModelId = getProviderModelId(internalModelId, "yunwu", params);
    const transformedParams = transformParamsForProvider(
      internalModelId,
      "yunwu",
      params
    );

    const response = await fetch(`${this.baseUrl}/v1/video/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...transformedParams,
        model: providerModelId,
      }),
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Response: { code: 200, msg: "success", data: { task_id: "xxx", status: "pending" } }
    const taskId = data.data?.task_id || data.task_id;

    return {
      taskId,
      provider: "yunwu",
      status: this.mapStatus(data.data?.status || data.status || "pending"),
      raw: data,
    };
  }

  async getTaskStatus(taskId: string): Promise<VideoTaskResponse> {
    const response = await fetch(`${this.baseUrl}/v1/video/query?task_id=${taskId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404 || response.status === 410) {
        return {
          taskId,
          provider: "yunwu",
          status: "failed",
          error: { code: "TASK_NOT_FOUND", message: errorText },
        };
      }
      throw new Error(`Failed to get task status (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const taskData = data.data || data;

    // Response: { code: 200, data: { task_id, status, video_url, error_msg } }
    const videoUrl = taskData.video_url || taskData.videoUrl;

    return {
      taskId: taskData.task_id || taskId,
      provider: "yunwu",
      status: this.mapStatus(taskData.status),
      videoUrl,
      error: taskData.error_msg
        ? { code: String(taskData.error_code || "ERROR"), message: taskData.error_msg }
        : undefined,
      raw: data,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseCallback(payload: any): VideoTaskResponse {
    const data = payload.data || payload;
    const videoUrl = data.video_url || data.videoUrl;

    return {
      taskId: data.task_id || data.taskId,
      provider: "yunwu",
      status: this.mapStatus(data.status),
      videoUrl,
      error: data.error_msg
        ? { code: String(data.error_code || "ERROR"), message: data.error_msg }
        : undefined,
      raw: payload,
    };
  }

  private mapStatus(status: string | undefined): VideoTaskResponse["status"] {
    if (!status) return "pending";
    const map: Record<string, VideoTaskResponse["status"]> = {
      pending: "pending",
      image_downloading: "processing",
      video_generating: "processing",
      video_generation_completed: "completed",
      video_upsampling: "processing",
      completed: "completed",
      failed: "failed",
      error: "failed",
    };
    return map[status.toLowerCase()] || "pending";
  }
}