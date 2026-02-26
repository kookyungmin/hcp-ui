import type { ComponentType, SVGProps } from "react";
import {
  DbIcon,
  IamIcon,
  ObservabilityIcon,
  ServerlessIcon,
  StorageIcon,
  VmIcon,
  VpcIcon
} from "@/shared/ui/service-icons";

export type CloudService = {
  id: string;
  name: string;
  summary: string;
  highlights: string[];
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: string;
  deep: string;
  soft: string;
};

export const cloudServices: CloudService[] = [
  {
    id: "vm",
    name: "VM 관리",
    icon: VmIcon,
    accent: "#2F80ED",
    deep: "#1E5FCB",
    soft: "#EAF3FF",
    summary: "Linux/Windows 인스턴스 생성, 시작/중지, 스펙 조정(Scale Up/Down)까지 운영할 수 있습니다.",
    highlights: ["인스턴스 라이프사이클 관리", "OS 템플릿 기반 빠른 배포", "스케일 정책 설정"]
  },
  {
    id: "db",
    name: "DB 관리",
    icon: DbIcon,
    accent: "#FF7A45",
    deep: "#E85F2A",
    soft: "#FFF1EA",
    summary: "데이터베이스 인스턴스를 생성하고 백업/복구 상태와 성능 지표를 추적합니다.",
    highlights: ["DB 상태 모니터링", "백업 스케줄 관리", "스토리지 사용량 추적"]
  },
  {
    id: "vpc",
    name: "VPC 관리",
    icon: VpcIcon,
    accent: "#4E6CFF",
    deep: "#354CCC",
    soft: "#EEF1FF",
    summary: "프로젝트 단위 VPC, 서브넷, 라우팅, 보안 그룹을 시각적으로 관리합니다.",
    highlights: ["네트워크 분리", "서브넷/라우팅 정책", "보안 그룹 설정"]
  },
  {
    id: "object-storage",
    name: "Object Storage",
    icon: StorageIcon,
    accent: "#18B6A4",
    deep: "#0E8E80",
    soft: "#E8FBF8",
    summary: "버킷 생성, 접근 정책, 객체 수명주기 설정 등 스토리지 운영 기능을 제공합니다.",
    highlights: ["버킷 정책", "접근 제어", "수명주기 자동화"]
  },
  {
    id: "iam",
    name: "IAM 관리",
    icon: IamIcon,
    accent: "#19A866",
    deep: "#117A4A",
    soft: "#E8F9F0",
    summary: "서브 계정 생성 및 RBAC 기반 권한 정책을 통해 서비스 접근을 통제합니다.",
    highlights: ["서브 계정 발급", "역할/권한 매핑", "권한 감사 로그"]
  },
  {
    id: "serverless",
    name: "Functions",
    icon: ServerlessIcon,
    accent: "#7A5CFF",
    deep: "#5C3FD4",
    soft: "#F1EDFF",
    summary: "Runtime Runner와 API Generator를 활용해 이벤트 기반 함수를 손쉽게 구성합니다.",
    highlights: ["함수 배포", "트리거 관리", "API 엔드포인트 생성"]
  },
  {
    id: "observability",
    name: "Observability",
    icon: ObservabilityIcon,
    accent: "#13A3C8",
    deep: "#0C7B98",
    soft: "#E7F9FF",
    summary: "메트릭과 로그, 알림을 통합해 서비스 상태를 실시간으로 관측하고 대응합니다.",
    highlights: ["통합 대시보드", "알람 룰", "장애 원인 분석"]
  }
];
