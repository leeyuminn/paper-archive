---
title: "Environment-aware Motion Matching"
short: "Env-MM"
authors: "Jose Luis Ponton, Sheldon Andrews, Carlos Andujar, Nuria Pelechano"
venue: "ACM TOG"
year: 2025
field: "Character animation"
topic: "Motion matching"
approach: "Environment features"
links:
  paper: "https://doi.org/10.1145/3763334"
  arxiv: "https://arxiv.org/abs/2510.22632"
  project: "https://upc-virvig.github.io/Environment-aware-Motion-Matching"
  code: ""
  video: ""
read_date: 2026-10-22
tags: [motion-matching, crowd-simulation, collision-avoidance, real-time, locomotion]
---

## 한 줄 요약

Motion Matching의 feature에 몸의 2D ellipse footprint를 environment feature로 추가해서, 장애물이나 다른 agent와의 충돌을 search 단계에서 penalty로 반영한다. 그래서 pose와 trajectory가 같이 결정되는 real-time 캐릭터 컨트롤러를 만든다.

## 요약

기존 Motion Matching은 목표 trajectory만 따라가고 주변 환경은 보지 않는다. crowd simulation 쪽은 steering(경로)과 body animation을 따로 처리하다 보니 몸 동작과 root 움직임이 어긋나고 foot sliding 같은 문제가 생긴다. 이 논문은 전처리 단계에서 mocap DB의 각 pose마다 20/40/60프레임 뒤의 몸 footprint를 2D ellipse로 근사해 environment feature로 저장한다. runtime에는 일반적인 query feature 거리에 더해, 주변 장애물과 ellipse 사이 거리에 log-barrier penalty를 걸어 합산한 점수로 best pose를 고른다. 그 결과 좁은 통로에서 sidestep을 하거나 torso를 돌리는 동작, 병목 앞에서 기다리는 동작이 별도 라벨링이나 multi-character capture 없이 단일 배우 데이터만으로 나온다. 장애물이 많은 worst-case 장면에서 search 한 번에 0.80 ms 정도 걸려 real-time으로 동작한다.

## 핵심 정리

- **Feature 구성**: query feature(발·hip 속도, 발 위치, 미래 20/40/60프레임 2D 위치·방향, 27차원)와 environment feature(같은 세 시점의 ellipse, 9차원)를 합쳐 36차원. environment feature는 query와 직접 비교하지 않고 penalty 계산에만 쓰인다. 이렇게 역할을 나눈 덕분에 높이 feature(점프/웅크리기 판단)처럼 새로운 feature를 붙이기 쉽다.
- **Ellipse 계산**: 다음 프레임 방향을 장축으로 잡고, 모든 joint를 장축·단축에 투영해 최대 거리를 반지름으로 쓴다. disk와 달리 sidestep과 정면 걷기를 구분할 수 있다.
- **Penalty**: 거리 d가 threshold t보다 작아지면 `-(t-d)^p log(d/t)` 형태의 log-barrier(IPC에서 착안)를 적용한다. 가까운 미래 ellipse일수록 가중치가 크다(λ40=0.4, λ60=0.1). 속도에 따라 environment weight를 키우는 Anticipation, 사용자 입력을 얼마나 우선할지 정하는 Responsiveness 같은 파라미터도 있다.
- **최적화**: 현재 best보다 점수가 나빠지는 순간 바로 버리는 early rejection, 주변 장애물 사전 선별, 장애물이 없을 때는 BVH search로 전환, SIMD와 data-oriented 설계를 쓴다. temporal coherence 쪽으로는 대표 feature vector(최소 stride 8프레임, 5% 차이)를 먼저 훑는 2단 search, 현재 best와의 dissimilarity에 따른 adaptive stride, 직전 best 근처부터 search 시작하는 방법을 쓴다.
- **실험**: Unity와 Burst compiler로 구현했고 단일 스레드 CPU에서 10프레임(60 Hz)마다 search한다. 장애물이 빽빽한 경로를 약 1분 30초 따라가는 실험(DB 101,026 pose)에서 결과는 다음과 같다.
  - 표준 Motion Matching: 0.22 ms, diversity 1997, 충돌 1회당 0.88 s, 전체 시간의 약 30%를 장애물과 겹친 채로 보냄
  - Ours: 0.80 ms, diversity 4378, 충돌 1회당 0.08 s, 겹친 시간 약 2%. trajectory error는 0.14 m로 baseline(0.09 m)보다 약간 높다(회피를 위한 우회 때문).
  - Linear Search(최적화 없음)는 9.50 ms. Disk 표현은 trajectory error 0.29 m로 가장 나쁘다(좁은 곳에서 멈춰 버림).
- DB 크기를 25%~400%로 바꿔도 search 시간은 선형보다 훨씬 완만하게 늘어난다. 다만 표준편차는 DB 크기에 비례해 커진다.
- mocap(Xsens)으로 새 DB를 만드는 데 준비부터 import까지 약 2시간이면 된다. 공개 DB는 184,553 pose(약 50분).

## 흥미로운 점

- "쿼리로 비교하는 feature"와 "penalty를 계산하는 feature"를 분리한 구조가 깔끔하다. 학습 없이 Motion Matching 파이프라인에 그대로 끼워 넣을 수 있다.
- coarse search가 정확한 match를 가끔 건너뛰기 때문에 오히려 pose diversity가 exhaustive search보다 높게 나왔다는 관찰.
- 기다리기, sidestep, torso 회전 같은 행동이 규칙 없이 DB와 penalty만으로 나온다. crowd steering과 body animation을 한 번에 푸는 접근이다.

## 한계와 의문

- 저자들이 밝힌 한계: skeleton만으로 ellipse를 만들어 mesh/skin은 반영하지 않는다. 333 ms 간격으로 샘플링하므로 충돌 없음을 보장하지 못한다. 환경 회피 때문에 입력 trajectory에서 벗어날 수 있어 빠른 반응이 중요한 게임에서는 trade-off가 생긴다.
- 성능 수치는 agent 1명 기준이다. agent 수에 선형으로 늘어난다고만 했는데, 수백 명 규모 crowd에서 실제 frame budget은 어떻게 될까?
- DB에 원하는 회피 동작이 없으면 결국 충돌하거나 멈춘다. DB 구성(capture 지시)에 얼마나 민감한가?
- 높이 feature 외에 문 열기, 물체 잡기 같은 접촉형 상호작용까지 같은 penalty 틀로 확장할 수 있을까?

## 나의 한마디
{: .mine-title}

