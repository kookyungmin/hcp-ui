import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, PageBody } from "@/shared/types/api";
import type { GenerateInstanceRequest, InstanceInfo, InstanceListItem, InstanceMeta } from "@/shared/types/instance";

export async function getInstanceMetaAllApi() {
  const response = await apiClient.get<ApiEnvelope<InstanceMeta>>("/computes/v1/instance/meta/all");
  return response.data.body;
}

export async function provisionInstanceApi(payload: GenerateInstanceRequest, idempotencyKey: string) {
  const normalizedTags = (payload.tags ?? [])
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter((t) => t.length > 0);
  const tagsValue: string | null = normalizedTags.length > 0 ? normalizedTags.join(",") : null;

  const response = await apiClient.post<ApiEnvelope<unknown>>(
    "/computes/v1/instance/provisioning",
    {
      ...payload,
      tags: tagsValue
    },
    {
      headers: {
        "X-Idempotency-Key": idempotencyKey
      }
    }
  );

  return response.data.body;
}

export async function getInstanceListApi(params: { searchKeyword: string; page: number; size: number }) {
  const { searchKeyword, page, size } = params;
  const response = await apiClient.get<ApiEnvelope<PageBody<InstanceListItem>>>(
    "/computes/v1/instance/list",
    {
      params: {
        searchKeyword,
        page,
        size
      }
    }
  );
  return response.data.body;
}

export async function stopInstanceApi(instanceId: string, idempotencyKey: string) {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    "/computes/v1/instance/stop",
    { instanceId },
    { headers: { "X-Idempotency-Key": idempotencyKey } }
  );
  return response.data.body;
}

export async function restartInstanceApi(instanceId: string, idempotencyKey: string) {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    "/computes/v1/instance/restart",
    { instanceId },
    { headers: { "X-Idempotency-Key": idempotencyKey } }
  );
  return response.data.body;
}

export async function terminateInstanceApi(instanceId: string, idempotencyKey: string) {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    "/computes/v1/instance/terminate",
    { instanceId },
    { headers: { "X-Idempotency-Key": idempotencyKey } }
  );
  return response.data.body;
}

export async function getInstanceInfoApi(instanceId: string) {
  const response = await apiClient.get<ApiEnvelope<InstanceInfo>>(`/computes/v1/instance/info/${encodeURIComponent(instanceId)}`);
  return response.data.body;
}

export async function updateInstanceTagsApi(instanceId: string, tags: string) {
  const response = await apiClient.patch<ApiEnvelope<unknown>>(
    "/computes/v1/instance/tag",
    { instanceId, tags }
  );
  return response.data.body;
}

export async function updateInstanceSpecApi(
  instanceId: string,
  specCode: string,
  storageType: "HDD" | "SSD",
  storageSize: number,
  idempotencyKey: string
) {
  const response = await apiClient.patch<ApiEnvelope<unknown>>(
    "/computes/v1/instance/spec",
    { instanceId, specCode, storageType, storageSize },
    { headers: { "X-Idempotency-Key": idempotencyKey } }
  );
  return response.data.body;
}

export async function getInstanceSshKeyApi(instanceId: string) {
  const response = await apiClient.get<ApiEnvelope<{ instanceId: string; keyName: string; sshKey: string }>>(
    `/computes/v1/instance/ssh-key/${encodeURIComponent(instanceId)}`
  );
  return response.data.body;
}

export async function upsertInstanceSshKeyApi(
  instanceId: string,
  keyName: string,
  sshKey: string,
  idempotencyKey: string
) {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    "/computes/v1/instance/ssh-key",
    { instanceId, keyName, sshKey },
    { headers: { "X-Idempotency-Key": idempotencyKey } }
  );
  return response.data.body;
}
