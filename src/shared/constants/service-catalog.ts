type ServiceMenuItem = {
  id: string;
  name: string;
  description: string;
};

type ServiceCategory = {
  id: string;
  label: string;
  services: ServiceMenuItem[];
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "compute",
    label: "Compute",
    services: [
      {
        id: "server",
        name: "서버 인스턴스",
        description: "Linux, Windows 인스턴스 생성, 스냅샷, 스케일 조정을 운영합니다."
      },
      {
        id: "functions",
        name: "Happy Functions",
        description: "Runtime Runner와 API Generator 기반 함수 실행을 지원합니다."
      }
    ]
  },
  {
    id: "database",
    label: "Database",
    services: [
      {
        id: "db-managed",
        name: "DB 관리",
        description: "백업/복구와 성능 지표를 포함한 데이터베이스 운영 기능입니다."
      }
    ]
  },
  {
    id: "network",
    label: "Network",
    services: [
      {
        id: "vpc",
        name: "VPC 관리",
        description: "VPC, Subnet, Routing, Security Group 정책을 관리합니다."
      }
    ]
  },
  {
    id: "storage",
    label: "Storage",
    services: [
      {
        id: "object-storage",
        name: "Object Storage",
        description: "버킷 정책, 접근 제어, 수명주기 설정을 제공합니다."
      }
    ]
  },
  {
    id: "security",
    label: "Security",
    services: [
      {
        id: "iam",
        name: "IAM 관리",
        description: "서브 계정과 RBAC 권한을 역할 기반으로 관리합니다."
      }
    ]
  },
  {
    id: "observability",
    label: "Observability",
    services: [
      {
        id: "observability",
        name: "Observability",
        description: "메트릭/로그/알람을 통합 관측해 운영 가시성을 높입니다."
      }
    ]
  }
];
