---
title: "A Practical Model for Realistic Butterfly Flight Simulation"
short: "Butterfly"
authors: "Qiang Chen, Tingsong Lu, Yang Tong, Guoliang Luo, Xiaogang Jin, Zhigang Deng"
venue: "ACM TOG"
year: 2022
field: "Bio-inspired simulation"
topic: "비행 시뮬레이션"
approach: "Force-based 모델"
links:
  paper: "https://doi.org/10.1145/3510459"
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-10-22
tags: [butterfly, flight-simulation, aerodynamics, curl-noise, procedural-animation]
---

## 한 줄 요약

날개-복부 상호작용을 담은 parametric maneuvering function과 단순화한 공기역학력·vortex force를 결합해, CFD 없이 실시간으로 나비 비행을 시뮬레이션한다.

## 요약

나비는 날갯짓 빈도가 낮고 날개와 복부가 서로 맞물려 움직이기 때문에, 몸통 상호작용을 빼면 특유의 비행이 나오지 않는다. 그렇다고 CFD 기반 방법은 실시간에 쓰기에 너무 비싸다. 저자들은 계층형 skeleton으로 리깅한 나비 모델(흉부·앞날개·뒷날개·복부)에 5개 maneuvering angle을 코사인 함수로 정의하고, 진폭과 주파수는 비행 속도에 따라 사이클마다 바꾼다. 각 날개 폴리곤에는 quasi-steady lift/drag를, 흉부에는 curl-noise 기반 vortex force를 걸고, 목표물로 향하는 선호 가속도를 더해 속도를 갱신한다. 바람, 비, 추격, 군집(100~200마리) 등 여러 장면에서 실시간으로 동작함을 보이고, user study로 baseline(cycle-frame 애니메이션)과 vortex force 제거 버전보다 사실적이라고 평가받았다.

## 핵심 정리

- **모델**: monarch, swallowtail 두 종. Unity Dynamic Bone으로 skeleton 구동, 날개 skeleton은 앞전(leading edge)을 따라 root→tip으로 배치. 흉부 1-DOF(pitch), 앞날개 3-DOF(flapping·feathering·sweeping), 뒷날개 1-DOF, 복부 1-DOF(몸 길이 축 회전).
- **Maneuvering function**: `θ = φa(u)·cos(2πf(u)t + φp) + φm`. 복부는 날개와 반대 위상(−180°), 흉부는 −90°. 진폭·주파수는 사이클 시작 시점 속도의 sigmoid 함수로 정하고, 한 사이클 안에서는 고정한다. 주파수 범위는 0~11Hz(실제 monarch는 9~11Hz지만 활공 표현을 위해 넓힘).
- **힘**: 폴리곤별 `½ρA|V|²·Cl(α)`, `½ρA|V|²·Cd(α)`. Lift/Drag 계수는 실험으로 정한 경험식. Vortex force는 Perlin noise 기반 curl-noise인데, 날개에 직접 걸면 과도하게 뒤틀려서 흉부 질량중심에만 적용한다.
- **Maneuvering control**: 목표점까지 거리에 ramp function을 걸어 선호 가속도 a_pre를 만들고(감지 거리 L = 4.5), 공기역학력·vortex·중력에서 나온 a_loc과 더해 속도 갱신. f와 φa는 sliding window(k = 10)로 평활화해서 급변을 막는다.
- **성능**(i7-7700, GPU 미사용): 단일 개체 60 FPS, 100마리 25 FPS, 200마리 15 FPS.
- **평가**: ground-truth 궤적이 없어서 정량 비교 대신 ablation(vortex force 제거), cycle-frame baseline 비교, 실제 영상 합성 비교, 질량·크기 변화 실험을 했다. user study는 152명. 7개 장면 realism 평균 4.32, Cronbach's α 0.78. validation 연구에서는 baseline 2.02 vs ours 4.49, w/o VF 1.93 vs ours 4.44였고 두 비교 모두 ANOVA p < 0.01.

## 흥미로운 점

- 날갯짓 자체는 정해진 주기 함수로 두고 진폭·주파수만 속도에 따라 바꾸는 구조라서, 물리 제어기 없이도 비행 상태에 반응하는 몸동작이 나온다.
- vortex force를 "물리적 후류 근사 + inherent noise 생성기"로 함께 쓰는 아이디어. 같은 그룹의 이후 벌 시뮬레이션 논문에서도 curl-noise를 이어서 쓴다.
- 질량을 줄이면 더 높이 날고, 날개를 키우면 수직 진동이 커지는 등 파라미터와 결과의 관계가 직관적이다.

## 한계와 의문

- 이륙·착지(다리와 몸의 협응)는 다루지 않는다.
- maneuvering function이 문헌에서 영감을 받은 것이고 실제 데이터로 보정하지 않았으므로, 실제 나비와 정확히 일치한다고 보기 어렵다.
- skeleton 기반 변형이라 날개 표면의 부드러운 휘어짐(weaving)이 부족하다. user study 자유 의견에서도 이 점이 주된 차이로 꼽혔다. 이후 Real-time Wing Deformation 논문이 이 문제를 다룬다.
- vortex force의 gain·η 값이 경험적으로 정해졌는데, 종이나 장면이 바뀌면 다시 조정해야 할까?

## 나의 한마디
{: .mine-title}

