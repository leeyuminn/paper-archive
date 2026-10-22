---
title: "A Bio-Inspired Model for Bee Simulations"
short: "Bee Sim"
authors: "Qiang Chen, Wenxiu Guo, Yuming Fang, Yang Tong, Tingsong Lu, Xiaogang Jin, Zhigang Deng"
venue: "IEEE TVCG"
year: 2025
field: "Bio-inspired simulation"
topic: "비행 시뮬레이션"
approach: "Force-based 모델"
links:
  paper: "https://doi.org/10.1109/TVCG.2024.3379080"
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-10-22
tags: [bee, swarm-simulation, curl-noise, collective-behavior, data-driven-calibration]
---

## 한 줄 요약

꿀벌 개체의 몸체 진동·roll 회피 같은 microscopic dynamics와, 정렬도가 낮고 noise가 많은 zigzag 군집 비행을 하나의 force 합성 모델로 실시간 시뮬레이션한다.

## 요약

새나 물고기와 달리 벌은 이웃과 속도를 잘 맞추지 않는(low-aligned) 군집을 이루고, 목표를 향해 반복 접근하는 zigzag 비행과 시각 기반 장애물 회피(몸을 굴리는 roll)를 보인다. 이 논문은 개체 수준에서는 생물학 실험을 근거로 한 oscillation force(lift·thrust·sway)와 시야(FoV) 기반 roll-to-avoidance를, 군집 수준에서는 curl-noise force와 SPH 계열 fluid의 pressure를 응용한 repulsion force를 쓰고, 세 force를 가중합해 벌을 움직인다. 가중치 등 핵심 파라미터 6개는 공개된 벌 비행 trajectory 데이터에 맞춰 genetic algorithm으로 보정한다. Boids, Brownian model, 기존 curl-noise 군집 기법과 비교해 더 부드럽고 noise가 살아 있는 궤적을 만들고, 300마리 이상을 실시간으로 시뮬레이션한다고 보고한다.

## 핵심 정리

- 전체 force: `F = κ1·Fo + κ2·Fcurl + κ3·Frepul`, 뉴턴 법칙으로 가속도·속도 갱신.
- **Oscillation force Fo**: thrust/sway는 각각 pitch·roll 각에 비례(`m·g·θ`), lift는 quasi-steady 공기역학(`½ρAu²·l(θpitch)`)으로 계산. 날갯짓 하나하나를 제어하지 않고 body attack angle을 고정익처럼 다뤄 단순화. pitch·roll은 기존 실험 결과에 맞춘 sinusoidal 함수로 주기 갱신.
- **Roll-to-avoidance**: 감지 각 90°(±45°) 시야 안에 장애물이 threshold보다 가까우면 다른 규칙을 무시하고 회피. ramp function으로 장애물 쪽 속도를 0으로 줄이며 미끄러지듯 돌아가고, 거리에 따라 roll 각을 키웠다가(가우시안 형태, 최대 45°) 회피 후 수평으로 복귀. roll 방향은 진행 방향과 장애물 방향 벡터의 외적 부호로 결정.
- **Curl-noise force**: Perlin noise로 만든 potential의 curl → 갑작스러운 방향 전환, 나선 비행 같은 inherent noise 표현. 단, 위치 기반이라 몸 크기를 고려하지 않아 개체 간 충돌을 막지 못함.
- **Repulsion force**: 벌을 capsule로 보고 density·pressure를 SPH 방식(poly6/spiky kernel)으로 계산해 밀어냄. 목표물을 정적 가상 입자로 샘플링해두면 접근-밀려남이 반복되어 zigzag가 나오고, 밀집 상황 충돌도 curl-noise보다 줄어듦(Fig. 7).
- **파라미터 보정**: Γ = {κ1, κ2, κ3, 격자 크기 L, noise 크기, 이웃 반경 h}. 지표는 가속도·속도·이웃과의 속도차·밀도·각속도·각가속도 6개, 실제 데이터와 시뮬레이션의 discrete PDF 차이를 목적함수로 사용. GA는 세대당 10개체, mutation 1%, crossover 90%, 200세대. fitness q는 165번째 반복에서 최대 0.53, 전체 약 10분.
- **실험**: Unity3D(C#), i7-12700KF. 비교 대상은 Boids, Brownian model, curl-noise 군집 기법, oscillation 모델. 실제 데이터 PDF와 비교 시 Brownian보다 가깝다고 보고. Ea, Eω, Eω̇은 여전히 차이가 남고, 밀도 지표 Eali도 다른 지표보다 덜 비슷함. 인터넷 영상, 기존 연구의 roll 회피 영상과는 정성 비교.

## 흥미로운 점

- SPH pressure를 "에이전트 간 반발 + 목표물 근처 zigzag 생성기"로 재해석해서 한 가지 장치로 두 문제를 푸는 구성.
- 정교한 날갯짓 대신 몸통 각도에 대한 사인 함수와 단순 공기역학만으로 개체의 흔들림을 만든다. 군집 규모로 늘릴 때 비용을 아끼는 실용적인 타협이다.
- 데이터가 적은 상황에서 학습 대신 "분포 매칭 지표 + GA"로 소수 파라미터만 보정하는 방식.

## 한계와 의문

- 저자들도 인정하듯 보정에 쓴 실제 데이터가 적고(착지하는 벌 군집 한 종류), 시뮬레이션 결과가 실제 영상과 완벽히 일치하지 않는다. 다른 상황(채집, 방어 등)에서도 같은 파라미터가 통할까?
- 단순화한 공기역학으로 만든 몸체 진동은 시각적으로 그럴듯할 뿐 물리적으로 정확하다는 보장이 없다. 저자들은 body-wing interaction을 고려하면 나아질 것이라고 본다.
- roll 회피는 정적 장애물 기준이다. 개체 간 공중 충돌은 별도 spring force를 추가해 처리했는데, 이 부분은 모델 본체와 어떻게 맞물리는지 더 확인이 필요하다.
- Table I의 FPS와 최종 파라미터 값은 텍스트 추출본에서 확인되지 않았다. 원문 표를 봐야 한다.

## 나의 한마디
{: .mine-title}

