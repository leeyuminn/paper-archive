---
title: "Deep reinforcement learning-based control algorithm for flight kinematics of insect-scale flyer"
short: "CFD-DRL"
authors: "Seungpyo Hong, Sejin Kim, Innyoung Kim, Donghyun You"
venue: "Advances in Engineering Software"
year: 2025
field: "Bio-inspired simulation"
topic: "비행 시뮬레이션"
approach: "Deep RL"
links:
  paper: "https://doi.org/10.1016/j.advengsoft.2025.104014"
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-10-22
tags: [flapping-wing, fluid-structure-interaction, deep-rl, data-augmentation, fwmav]
---

## 한 줄 요약

고비용 CFD-CSD(유체–구조 연성) 시뮬레이션을 그대로 환경으로 쓰고 physics-guided data augmentation으로 데이터를 불려서, 유연한 날개를 가진 초파리 크기 flyer가 복잡한 유동과 외란 속에서 목표점까지 날아가 hovering하는 Deep RL(TD3) controller를 학습시켰다.

## 요약

기존 FWMAV 제어는 quasi-steady 공력 모델에 PD/LQR controller를 붙이는 방식이 많았는데, 작은 스케일에서는 unsteady·nonlinear 효과와 날개 유연성 때문에 모델 정확도가 떨어진다. 이 논문은 공력을 단순화하지 않고 2D CFD-CSD(immersed boundary 기반)로 유체, 유연한 날개, 강체 몸통을 강하게 연성해 풀고, 그 결과를 TD3 agent의 학습 데이터로 쓴다. 날갯짓 1 stroke 시뮬레이션에 약 5분이 걸리므로, 한 번의 시뮬레이션 데이터를 translation·mirroring·rotation(중력 방향도 함께 회전)으로 복제해 replay buffer를 채운다. 여러 유속의 uniform flow에서 multi-agent로 학습한 policy는 추가 학습 없이 처음 보는 방향·세기의 유동, 시공간적으로 변하는 복잡한 유동, 큰 moment/force 외란에서도 목표 추적과 회복에 성공한다.

## 핵심 정리

- **Flyer 모델**: 2D 유연 날개(leading edge가 clamp되어 flapping + pitching)와 원통형 몸통(질량 0.6 mg). 3D 힘은 2D 결과에 aspect ratio를 곱해 근사한다. Re = 84.8, 기준 날갯짓 주파수 200 Hz. 몸통은 평면 안에서 이동 2 + 회전 1 DoF.
- **State/Action/Reward**: stroke마다 한 번 행동을 고른다. action = (flapping amplitude, pitch amplitude, frequency). state = 목표 대비 위치, pitch(sin/cos), 속도, 각속도, antenna로 측정한 국소 유속, leading edge 위치, stroke 방향, body force(중력). reward = −sqrt(L/L0) − ω²(목표 거리 + 각속도 패널티).
- **TD3**: actor/critic 모두 400-400-400-300 FC, Leaky ReLU, Adam lr 1e-4, γ=0.99, 배치 100. 목표 10 length unit 이내에서는 exploration noise를 끈다.
- **Physics-guided augmentation**: 시작점 translation(100개 지점), x 방향 mirroring(중력이 −y이므로 x만 유효), π/5 간격 rotation(중력 벡터도 같이 회전하고 state에 포함). inertial frame을 써야 복제본이 서로 다른 샘플이 된다. 정지 유체 실험에서 augmentation이 없으면 매 episode 추락, translation+mirroring만 쓰면 부분 개선에 그치고, rotation까지 쓰면 첫 episode에 hovering에 성공했다.
- **Multi-agent + curriculum**: 유속 0, 1, 2, 3 m/s(+x 방향)의 flyer 4개가 하나의 agent를 공유한다. 학습 초기에는 antenna 측정값이 vortex 때문에 너무 noisy해서, 경계 유입 속도로 대체해 학습한 뒤 antenna 값으로 되돌리는 2단계 방식을 쓴다. 처음부터 antenna 값을 쓰면 모두 실패한다(Appendix A).
- **평가**: 시공간 변동 유동에서 목표 전환, 180°/90° 선회, 강한 moment(Ristroph et al. 실험의 62.5배)와 force(체중의 300배, 빗방울 충돌 기반) 외란을 넣었다. moment 외란은 2 stroke 안에 거의 안정화되며, 외부 유동을 오히려 안정화에 활용한다. 정지 유체에서는 더 많은 stroke가 필요했다.

## 흥미로운 점

- 회전 augmentation에서 중력까지 같이 돌려 "가상의 중력 방향" 시나리오를 만들고 중력을 state에 넣은 점. 한 방향 유동에서만 학습했는데 임의 방향 유동에 대응할 수 있게 된다.
- 학습된 전략을 해석해 보면 force 외란 회복 때 downstroke는 수직 lift, upstroke는 수평 방향 보정으로 역할을 나눈다. RL이 찾아낸 전략을 CFD vorticity와 함께 볼 수 있다는 것이 고충실도 시뮬레이터를 쓰는 장점이다.
- 감각 입력이 noisy할 때 "학습 땐 깨끗한 privileged 값 → 배포 땐 실제 센서 값"으로 넘어가는 2단계 학습은 캐릭터 제어 쪽 teacher-student 구조와 비슷한 발상이다.

## 한계와 의문

- 전부 2D 시뮬레이션이다. 3D 확장 방법(좌우 날개 별도 제어, state/action 정의)은 Appendix B에 제안만 있고 실험은 없다. 3D CFD-CSD는 더 빨라져야 한다고 저자들도 쓴다.
- 센서 지연과 신호 noise를 고려한 실제 제어나 하드웨어 이식은 향후 과제로 남아 있다.
- 학습된 policy가 hovering 중에도 stroke마다 kinematics가 크게 요동한다(Fig. 6c). 실제 actuator에 바로 쓸 수 있을까? 저자들은 action smoothing을 제안하지만 실험으로 검증하지는 않았다.
- 전체 학습에 실제 CFD-CSD stroke가 몇 번, 계산 시간이 얼마나 들었는지는 본문에서 정확한 총량을 확인하지 못했다.
- 공학(FWMAV 제어) 논문이라 그래픽스용 시각적 사실성보다는 제어 성능과 물리 해석이 초점이다.

## 나의 한마디
{: .mine-title}

