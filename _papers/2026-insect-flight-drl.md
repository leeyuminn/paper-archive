---
title: "Data-Driven Control of Insect Flapping Flight via Deep Reinforcement Learning"
short: "InsectDRL"
authors: "Tingsong Lu, Qiang Chen, Yuming Fang, Camille Le Roy, Xiaogang Jin, Zhigang Deng"
venue: "IEEE TVCG"
year: 2026
field: "Bio-inspired simulation"
topic: "비행 시뮬레이션"
approach: "Deep RL"
links:
  paper: "https://doi.org/10.1109/TVCG.2026.3677790"
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-10-22
tags: [insect-flight, flapping-wing, aerodynamics, deep-rl, obstacle-avoidance]
---

## 한 줄 요약

실제 wingbeat 데이터로 만든 날갯짓 kinematics, unsteady 항을 더한 semi-empirical aerodynamic model, PPO 기반 Deep RL controller를 묶어 곤충(blue Morpho 나비, hoverfly)이 날갯짓만으로 스스로 비행하고 장애물을 피하게 만든 프레임워크.

## 요약

기존 곤충/새 비행 시뮬레이션은 quasi-steady 공력 모델에 의존하고, 제어도 경로 최적화·mocap 매칭·수작업 규칙(예: 날갯짓 없이 계속 상승하는 나비)에 묶여 있어 새로운 환경에 적응하는 일반적인 학습 메커니즘이 없었다. 이 논문은 (1) 실제 wingbeat 기록을 Fourier series(3차 harmonic까지)로 피팅한 baseline cycle을 amplitude scaling·frequency time-warping으로 변형해 연속적인 날갯짓을 만들고, (2) blade element 기반 quasi-steady lift/drag에 added mass force와 rotational circulation force를 더한 공력 모델의 계수를 CFD·실험 데이터에 PSO로 맞춘 뒤, (3) 좌우 날개의 amplitude·frequency를 action으로 하는 Deep RL policy를 학습시킨다. 학습은 beginner(기본 기동) → intermediate(실제 비행 데이터 모방) → expert(depth 카메라 기반 장애물 회피)의 3단계 curriculum으로 진행된다. 실제 영상·ground truth 비교, 공력 모델 오차, 사용자 연구에서 기존 butterfly 시뮬레이션(Chen et al.)보다 좋은 결과를 보고한다.

## 핵심 정리

- **Kinematics**: 날개 하나당 stroke / deviation / rotation 3개 각도. 여러 cycle 평균을 Fourier series로 피팅한 baseline cycle을 A, f로 변형하고, cycle 사이 전환을 부드럽게 이어 붙인다. 몸체는 6-DoF, 날개는 hierarchical hinge로 thorax에 연결.
- **Aerodynamics**: 날개를 spanwise blade element로 나누고 element마다 quasi-steady lift/drag + added mass + rotational circulation을 계산해 합산. 세 계수(C_Pα, C_D0, C_r)를 PSO(100 particles, 최대 500 iteration)로 최적화했고 약 370 iteration에서 수렴(C_Pα=2.61, C_D0=0.09, C_r=0.41). 몸체 회전은 Euler 방정식, 관성은 prolate spheroid로 근사.
- **RL 설정**: state = (목표까지 displacement, body angle, velocity, acceleration, visual observation), action = (좌/우 amplitude, 좌/우 frequency). Reward = goal − kinematic(실제 데이터 분포에서 벗어난 A, f 패널티) − dynamics(속도·가속도 범위) − balance(각속도, 특히 roll) − collision. reward weight 자체를 Softplus로 양수 유지 + L2 정규화하며 policy와 함께 학습한다.
- **Network/학습**: 64×64 depth 이미지를 conv 3층 + dense로 인코딩해 나머지 상태와 결합. Actor-Critic, PPO(clipped) + GAE. Unity ML-Agents로 구현.
- **비교와 수치**: 공력 모델은 Morpho CFD 데이터에서 Chen et al.의 quasi-steady 모델, hoverfly 실험 데이터에서 기존 semi-empirical 모델(quasi-steady + added mass)보다 MSE가 낮음(Table II). 실제 Morpho 데이터와의 PDF 기반 일관성 점수는 ours 0.71 vs SOTA 0.54. VR 사용자 연구(30명)에서 full method가 Chen et al. 대비 26:4, coupling 제거 버전 대비 25:5로 선호됨(p < 0.01).
- **Ablation**: 단순 cosine 날갯짓은 cycle 간 amplitude가 바뀔 때 불연속이 생겨 가속도 오차가 커지고, unsteady 항을 빼면 controller가 frequency·amplitude를 전반적으로 키워 보상하려다 실제 비행 패턴에서 멀어진다. kinematics–dynamics coupling을 끊으면 장애물을 보고도 피하지 못한다.

## 흥미로운 점

- 나비의 주기적인 몸통 pitching을 따로 만들지 않았는데, 낮은 frequency 날갯짓과 wing-body coupling에서 자연스럽게 나온다는 점.
- "날갯짓 없이 상승" 같은 비물리적 행동을 막는 방법이 규칙 추가가 아니라 action을 날개 kinematics로만 제한하는 것이라는 점. 상승하려면 날갯짓을 빠르게 해야만 한다.
- Kinematic reward를 실제 데이터의 평균·표준편차로 정의해서, 데이터가 적어도 "그 종다운" 날갯짓 범위 안에 머물게 하는 설계.
- 장애물과의 거리를 depth 이미지에서 바로 얻어서 나무 같은 복잡한 형상도 단순화 없이 처리한다.

## 한계와 의문

- 저자들이 밝힌 한계: 소수의 기록을 평균 내 Fourier 피팅했기 때문에 종·행동별 날갯짓 다양성이 부족하고, 공력 계수 최적화에 쓰는 CFD 데이터 생성 비용이 크다.
- 날개 변형(wing deformation)은 모델링하지 않는다. 저자들도 향후 과제로 언급한다.
- action이 amplitude와 frequency뿐이고 stroke plane 기울기나 rotation 타이밍 같은 다른 조종 수단은 없다. 곤충이 실제로 쓰는 조종 전략을 얼마나 담을 수 있을까?
- 학습 가능한 reward weight가 실제로 어떤 값으로 수렴했는지, 고정 weight와 비교하면 차이가 있는지는 본문에서 확인하지 못했다(supplemental에 있을 수도 있음).
- 헤더 날짜는 "NOVEMBER 2025"이고 DOI는 2026으로 되어 있다. 정식 게재 연도는 확인이 필요하다.

## 나의 한마디
{: .mine-title}

