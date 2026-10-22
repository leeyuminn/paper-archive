---
title: "Real-time Wing Deformation Simulations for Flying Insects"
short: "WingDeform"
authors: "Qiang Chen, Zhigang Deng, Feng Li, Yuming Fang, Tingsong Lu, Yang Tong, Yifan Zuo"
venue: "SIGGRAPH"
year: 2024
field: "Bio-inspired simulation"
topic: "비행 시뮬레이션"
approach: "날개 모델링"
links:
  paper: "https://doi.org/10.1145/3641519.3657434"
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-03-25
tags: [insect-wing, deformation, skeleton-driven, mass-spring, aerodynamics]
---

## 한 줄 요약

방사형 virtual skeleton과 내부·외부 force, mass-spring 탄성을 결합해서 곤충 날개의 변형파(deformation wave) 전파와 휘어짐을 실시간으로 시뮬레이션한다.

## 요약

기존 곤충 비행 시뮬레이션은 날개를 강체나 폴리곤 덩어리로 다뤄서, 날개 뿌리에서 끝으로, 앞전에서 뒷전으로 퍼지는 변형파를 표현하지 못했다. 저자들은 앞전을 따라가는 주 joint chain에 날개맥 구조를 참고한 방사형 chain을 추가한 skeleton을 만들고, 각 chain이 앞전보다 거리 비례로 늦게 움직이게 해 longitudinal/transverse 변형파를 만든다. 휘어짐은 날갯짓에서 역산한 internal force와 삼각형별 공기역학 external force로 joint에 torque를 주어 만들고, 과도한 뒤틀림은 joint 간 mass-spring 탄성(implicit integration)으로 막는다. monarch 나비, firefly, painted lichen moth, fishfly에 적용해 실제 영상과 정성 비교하고, 40명 paired-comparison user study에서 기존 나비 비행 모델과 wave propagation을 뺀 버전보다 유의하게 좋은 평가를 받았다.

## 핵심 정리

- **Skeleton**: 사람이 날개 근접 이미지를 보고 날개맥에 맞춰 직접 설계. chain은 최소 3개, chain당 joint 최소 3개이고, 모든 chain의 joint 수가 같다. 메시는 dual quaternion skinning으로 리깅.
- **변형파**: 각 chain은 `cos(2πf·(t − t̂) + φ)` 형태로 구동. 지연 t̂는 주 chain과의 root 거리 비율로 정하고, Heaviside 함수로 아직 시작 안 된 chain은 멈춰 둔다. flapping·sweeping·feathering 세 회전을 함께 구동한다.
- **Bending**: joint torque = r̂ × (internal + skinning 가중 external + 중력). internal force는 harmonic oscillation의 가속도에서 역산하고, 진폭·주파수는 사이클마다 속도에 따라 바뀐다(최대 주파수 11Hz, 비수평 AoA일 때 상한 처리). external force는 삼각형별 quasi-steady lift/drag.
- **Elasticity**: 인접 joint 사이 Hooke 스프링 에너지. implicit integration을 최적화 문제로 바꿔 Newton-Raphson으로 푼다.
- **실험**: Unity3D(C#), Xeon W-1290P, time step 0.02. FPS는 monarch 100, firefly 172, fishfly 160, painted lichen moth 150. 비행 궤적은 저자들의 이전 나비 비행 모델로 생성. snailfish 지느러미에도 적용해 확장성을 보였다.
- **User study**: 40명, 방법 (I) 기존 나비 모델 [Chen 2022b], (II) wave propagation 제거, (III) 전체. 12쌍 paired comparison. III > II > I 모두 통계적으로 유의(t-test).

## 흥미로운 점

- 천이나 thin-shell 시뮬레이션 대신 "앞전이 끌고 나머지가 지연되어 따라오는" 생물학 관찰을 skeleton 지연으로 직접 넣었다. 단순하지만 효과가 확실하다.
- skeleton 기반이라 아티스트 파이프라인(리깅/스키닝)에 바로 얹을 수 있다.
- 공기역학 계수만 바꿔 물속 지느러미에도 같은 틀을 썼다. 날개처럼 생긴 부속지 전반에 쓸 수 있는 틀로 볼 수 있다.

## 한계와 의문

- skeleton을 수작업으로 설계하고 날개맥의 실제 기능은 반영하지 않는다. 저자들은 2D 날개 이미지에서 venation을 추출하는 학습 방법을 향후 과제로 든다.
- ground-truth 변형 데이터가 없어 파라미터는 경험값이고 정량 평가도 없다. 물리적으로 정확하다고 주장하지 않는다.
- 날개 변형이 몸통 비행 dynamics에 되먹임되는가? 궤적은 기존 모델로 따로 만든 것으로 보이는데, 양방향 결합 여부는 원문에서 명확하지 않다.
- 원문 표기 "fishfly"가 정확히 어떤 곤충인지(인용은 flying fish 문헌이다)는 확인이 필요하다.

## 나의 한마디
{: .mine-title}

