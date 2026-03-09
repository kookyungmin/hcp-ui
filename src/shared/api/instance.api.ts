import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, PageBody } from "@/shared/types/api";
import type { GenerateInstanceRequest, InstanceListItem, InstanceMeta } from "@/shared/types/instance";

export async function getInstanceMetaAllApi() {
  const response = await apiClient.get<ApiEnvelope<InstanceMeta>>("/computes/v1/instance/meta/all");
  return response.data.body;
}

export async function provisionInstanceApi(payload: GenerateInstanceRequest, idempotencyKey: string) {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    "/computes/v1/instance/provisioning",
    {
      ...payload,
      tags: payload.tags.join(",")
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
