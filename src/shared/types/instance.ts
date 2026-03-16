export type InstanceMetaOsImage = {
  imageCode: string;
  osName: string;
  osVersion: string;
  description: string;
};

export type InstanceMetaSpec = {
  specCode: string;
  specName: string;
  description: string;
};

export type InstanceMetaVpc = {
  vpcCode: string;
  vpcName: string;
  description: string;
  cidrBlock: string;
  defaultEgressPolicy: string;
  defaultIngressPolicy: string;
};

export type InstanceMeta = {
  osImageList: InstanceMetaOsImage[];
  specList: InstanceMetaSpec[];
  vpcList: InstanceMetaVpc[];
};

export type GenerateInstanceRequest = {
  ownerId: string;
  name: string;
  tags: string[];
  imageCode: string;
  specCode: string;
  storageType: "HDD" | "SSD";
  storageSize: number;
  vpcCode: string;
};

// Instance list types
export type InstanceStatus =
  | "PROVISIONING"
  | "RESTARTING"
  | "RUNNING"
  | "STOPPING"
  | "STOPPED"
  | "TERMINATING"
  | "TERMINATED"
  | "FAILED"
  | "FAILE"; // tolerate typo variant if server returns it

export type InstanceListItem = {
  instanceId: string;
  ownerId: string;
  name: string;
  tags: string[];
  osName: string;
  osVersion: string;
  vpcName: string;
  cpu: string; // e.g., "2"
  memory: string; // e.g., "256Mi"
  storageSize: number;
  status: InstanceStatus;
  publicIp: string | null;
  privateIp: string | null;
  message?: string;
};

export type InstanceInfo = {
  instanceId: string;
  ownerId: string;
  name: string;
  tags: string[];
  imageCode: string;
  specCode: string;
  vpcCode: string;
  storageType: "HDD" | "SSD";
  storageSize: number;
  status: InstanceStatus | string;
  publicIp: string | null;
  privateIp: string | null;
};
