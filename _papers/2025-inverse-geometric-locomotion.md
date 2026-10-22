---
title: "Inverse Geometric Locomotion"
short: "InvGeoLoco"
authors: "Quentin Becker, Oliver Gross, Mark Pauly"
venue: "ACM TOG"
year: 2025
field: "Bio-inspired simulation"
topic: "Locomotion 시뮬레이션"
approach: "Spacetime optimization"
links:
  paper: "https://doi.org/10.1145/3731187"
  arxiv: ""
  project: ""
  code: "https://github.com/EPFL-LGG/inverse_geometric_locomotion"
  video: ""
read_date: 2026-10-22
tags: [geometric-locomotion, inverse-design, differentiable-simulation, gait-optimization, shape-space]
---

## 한 줄 요약

몸의 모양 변화만으로 움직임이 결정되는 geometric locomotion에서, 원하는 궤적(목표 위치·방향, 경유지, 충돌 회피, 효율)을 만족하는 shape sequence를 adjoint gradient로 역최적화하는 framework.

## 요약

뱀의 미끄러짐, 고양이의 공중 자세 회복, 저 Reynolds 수 유영처럼 외력 없이 몸 변형만으로 이동·회전하는 경우에는 geometric momentum 보존 조건이 shape 변화와 전역 운동을 엄밀하게 묶어 준다. Gross et al. [2023]이 shape sequence에서 궤적을 구하는 forward 문제를 variational integrator로 풀었다면, 이 논문은 그 반대로 목표 궤적을 주면 shape sequence를 찾는 inverse 문제를 다룬다. 운동은 momentum 조건으로 완전히 정해지므로 최적화 변수는 shape sequence뿐이고, 목적함수의 gradient는 6×6 선형계를 차례로 푸는 adjoint 방법으로 해석적으로 구해 L-BFGS로 최적화한다. serpenoid curve, linkage, point handle, modal basis 같은 reduced shape space와 cubic spline 시간 보간으로 자유도를 줄여 문제를 안정화한다. 뱀, 고양이, stingray, Purcell swimmer, 로봇 등 다양한 예제에서 gait를 발견하고 기존 gait를 개선한다.

## 핵심 정리

- **기하학적 설정**: configuration space M을 shape space S와 rigid motion SE(3)의 fiber 구조로 본다. 주어진 shape 경로의 "horizontal lift"가 실제 운동이 되고, 이는 momentum이 초기값(정지 상태면 0)으로 유지되는 6개의 등식 조건과 같다. metric 선택이 물리 시나리오를 결정한다. 질량 기반이면 관성 지배(무중력 우주인, 고양이), resistive force theory 기반 anisotropic 소산 metric이면 소산 지배(뱀, 미생물)가 된다.
- **Objective**: 최종 목표 위치·방향(SE(3) 거리), 경유 checkpoint(도달 시점도 최적화), 무게중심 이동 패널티(제자리 회전 유도), IPC barrier 기반 자기충돌 회피, pseudo SDF로 표현한 장애물 패널티, 시작·끝 pose 고정, cyclic gait 조건(S_0 = S_N), reference sequence를 따라가는 semantic 패널티, 소산 에너지·membrane energy 정규화.
- **미분과 최적화**: Theorem 4.1에서 adjoint 벡터로 shape에 대한 gradient를 유도하고, reduced shape space와 spline 쪽은 PyTorch autodiff로 이어 붙인다. 운동 방정식은 penalty나 collocation이 아니라 매 timestep마다 정확히 만족된다.
- **Reduced shape space**: serpenoid(뱀·선충), linkage의 dihedral angle, point handle, Laplace–Beltrami 고유벡터(12개), membrane Hessian modal basis(stingray는 40개 mode). vertex를 전부 자유 변수로 두면 운동이 혼란스러워지고, 정규화나 reduced 공간을 쓰면 부드러워진다(Fig. 12).
- **검증과 결과**: Purcell swimmer에서 알려진 최적 gait(Tam & Hosoi)의 displacement를 99.7%까지 달성. 무중력 Armadillo 우주인의 turning gait는 한 cycle당 회전량이 5배로 늘었다. 관절 하나가 고장 난 뱀 로봇의 gait 적응도 보여준다. Apple M1 Max CPU에서 Python으로 구현했다.

## 흥미로운 점

- 에너지 소산으로 정규화한 최적 궤적의 소산률이 거의 일정하게 나와 sub-Riemannian geodesic에 가깝다. 이렇게 하면 동작이 자연스러워 보인다는 관찰.
- 작은 random perturbation에서 시작해 "아무것도 없는 상태에서" gait를 발견한다. 데이터 없이 형태학만으로 이동 전략을 탐색할 수 있다.
- 같은 framework 안에서 animator가 준 reference 동작의 semantics를 유지하면서 목표만 바꿔 맞출 수 있다(고양이 self-righting). 애니메이션 툴로 쓰기 좋은 구조다.
- RL이나 force 기반 controller 없이 운동을 shape 경로의 lift로만 본다. 같은 분야의 Deep RL 기반 생물 시뮬레이션과 대비해서 보기 좋다.

## 한계와 의문

- 저자들이 밝힌 한계: 매질의 동역학을 무시한다. 고 Reynolds 수의 수중·공중 이동에 중요한 vortex는 표현할 수 없다. stingray도 엄밀한 적용 범위의 경계 사례라고 직접 말한다.
- 제약을 soft penalty로 다루기 때문에 충돌 제약이 조금 위반될 수 있다(Fig. 8). local minimum에 빠지면 목표가 불가능해서인지 shape space가 너무 제한적이어서인지 구분하기 어렵다.
- shape space 설계가 결과를 크게 좌우한다(serpenoid 파장 bound에 따라 수렴이 달라짐, Fig. 22). 또 물리적으로 가능한 자세인지 모르는 상태라 목표를 너무 크게 잡으면 자기교차가 생긴다.
- 형태(rest shape)는 입력으로 고정된다. 형태와 gait를 함께 최적화하는 것은 향후 과제다.
- 표준 접촉 마찰이나 중력이 있는 지상 보행(다리 달린 동물)에도 이 framework를 쓸 수 있을까? 본문의 뱀도 "점성 매질에 잠긴 것처럼" 근사했다.

## 나의 한마디
{: .mine-title}

