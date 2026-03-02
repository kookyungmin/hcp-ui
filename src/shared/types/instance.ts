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
