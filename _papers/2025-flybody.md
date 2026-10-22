---
title: "Whole-body physics simulation of fruit fly locomotion"
short: "flybody"
authors: "Roman Vaxenburg, Igor Siwanowicz, Josh Merel, Alice A. Robie, Carmen Morrow, et al. (Yuval Tassa, Srinivas C. Turaga)"
venue: "Nature"
year: 2025
field: "Bio-inspired simulation"
topic: "Locomotion 시뮬레이션"
approach: "Deep RL"
links:
  paper: "https://doi.org/10.1038/s41586-025-09029-4"
  arxiv: ""
  project: ""
  code: "https://github.com/TuragaLab/flybody"
  video: ""
read_date: 2026-04-29
tags: [drosophila, mujoco, imitation-learning, hierarchical-control, insect-locomotion]
---

## 한 줄 요약

초파리 몸 전체를 해부학적으로 정밀하게 MuJoCo 모델(67개 부위, 102 DoF)로 만들고, fluid/adhesion 모델과 imitation 기반 Deep RL로 걷기와 비행을 하나의 모델에서 재현한 오픈소스 플랫폼.

## 요약

신경계가 행동을 만드는 방식을 모델링하려면 몸의 biomechanics가 정확해야 한다는 문제의식에서 출발한다. 공초점 현미경으로 암컷 D. melanogaster 전신을 촬영·분할해 MuJoCo 모델을 만들고, 날개 비행용 phenomenological fluid model(stateless, quasi-steady)과 벽·천장을 걷기 위한 adhesion actuator를 MuJoCo 기능으로 추가했다. 실제 파리의 고속 영상 궤적을 따라가도록 DMPO로 steerable한 low-level controller를 비행용과 보행용으로 각각 학습했다. 비행 controller는 고정된 wing-beat pattern generator(WPG)에 MLP가 작은 편차를 더하는 구조다. 끝으로 학습된 비행 controller를 고정하고 그 위에 vision 기반 high-level navigator를 학습시켜, 지형 높이 유지와 trench 통과 같은 시각 유도 비행을 보여준다.

## 핵심 정리

- **몸 모델**: 67개 부위를 Fiji로 수동 분할 → Blender에서 저폴리곤화·조립(66개 관절, 102 DoF) → MuJoCo로 옮겨 geom 근사, 부위별 질량 측정. 날개는 torque actuator, 나머지는 position actuator. tarsi와 abdomen은 tendon으로 여러 DoF를 묶어 함께 구동한다. vision, vestibular, proprioceptive, mechanosensory 센서를 갖는다.
- **Fluid model**: 타원체 기반으로 added mass, viscous drag, viscous resistance, Magnus lift, Kutta lift 5가지를 근사한다. 날개 유연성이나 vortex 같은 빠진 효과는 안정적인 hovering이 나오도록 계수를 최적화해서 흡수한다. 실제로는 Kutta lift와 viscous drag가 지배적이었고, 계수를 ±20% 바꿔도 비행이 안정적이었다.
- **비행 imitation**: D. hydei 비행 궤적 272개(약 53초) 중 216개로 학습. 입력 62차원, 출력 12차원(wing torque, head/abdomen 각도, WPG 주파수). 다리는 접어서 고정. reward는 CoM과 자세만 맞추게 하고, 날개 각도는 평가에만 썼다. test 56개 궤적에서 위치 오차 중앙값 0.25 mm, 자세 오차 5° 미만.
- **보행 imitation**: 2D keypoint 13개를 regularized IK로 3D 자세로 바꾼 데이터(약 16,000개 궤적, 80분) 중 약 13,000개로 학습. 입력 286차원, 출력 59차원. 패턴 생성기 없는 MLP를 쓴다. test 3,200개 궤적에서 위치 오차 중앙값 0.4 cm, 자세 오차 4°. 언제나 3개 이상 다리가 지면에 있고, 속도가 느릴수록 stance 다리가 많아지는(4 cm/s에서 3.1개, 1 cm/s에서 3.9개) 실제 파리의 경향을 재현한다.
- **Hierarchical vision flight**: 눈은 32×32, 150° FOV 카메라. CNN과 high-level navigator만 학습하고 low-level 비행 controller는 freeze. bumps 과제에서 높이 오차 중앙값 0.045 cm, trench 과제에서 0.032 cm.
- **계산 비용**: 시뮬레이션 10 ms에 CPU 한 코어로 비행 421.5 ms, 보행 68.65 ms. 학습에 보행 약 10^9, 비행 약 10^8 step이 필요해 Ray 기반 multi-CPU/GPU 병렬화를 썼다.

## 흥미로운 점

- 비행 controller에서 reward는 CoM만 맞추게 했는데도, 실제 파리처럼 좌우 날개 stroke의 작은 비대칭만으로 saccade의 큰 가속을 만든다. 날개 운동을 직접 지도하지 않았다는 점에서 물리 모델이 그럴듯하다는 근거가 된다.
- WPG가 baseline을 주고 policy는 편차만 학습하는 구조. 비행처럼 기본 패턴이 거의 고정된 운동에서는 좋은 초기화가 되어 학습이 빨라진다. 반면 보행은 속도마다 gait가 달라서 이 방식을 쓰지 않았다는 판단 기준이 명확하다.
- adhesion을 reward에 넣지 않았는데 경사에서 앞·중간 다리와 뒷다리를 다르게 쓰는 전략이 저절로 나온다.
- 학습된 low-level controller를 재사용하는 계층 구조는 캐릭터 애니메이션의 skill reuse(CoMic 등)와 같은 계열이다.

## 한계와 의문

- 관절은 hinge 조합으로 단순화했고(특히 neck, wing hinge, thorax–coxa), actuator도 근육이 아니라 이상적인 position/torque actuator다. 저자들도 제어 신호 자체를 생물학적으로 해석하지 말고 출력 torque만 보라고 경고한다.
- Fluid model은 quasi-steady라서 transient 공력 현상은 시간 평균 효과로만 들어간다. 날개는 강체다.
- 비행 데이터가 D. hydei인데 모델은 D. melanogaster다. 주파수 차이(218 Hz vs 192 Hz) 때문에 wing-beat frequency를 직접 비교하지 않았고, 모델의 주파수 변화 폭(약 0–10 Hz)은 실제 파리(최대 40 Hz)보다 좁다.
- 보행 모델은 좌회전과 우회전에서 앞다리 stride 조절이 비대칭인데, 실제 파리에는 없는 특성이다. 원인은 무엇일까?
- 걷기와 비행 controller가 따로 있다. 이착륙처럼 둘 사이를 오가는 전환은 다루지 않는다.

## 나의 한마디
{: .mine-title}

