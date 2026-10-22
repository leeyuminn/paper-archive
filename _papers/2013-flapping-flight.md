---
title: "Data-driven Control of Flapping Flight"
short: "Bird Flight"
authors: "Eunjung Ju, Jungdam Won, Jehee Lee, Byungkuk Choi, Junyong Noh, Min Gyu Choi"
venue: "ACM TOG"
year: 2013
field: "Bio-inspired simulation"
topic: "비행 시뮬레이션"
approach: "Data-driven 제어"
links:
  paper: ""
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-10-22
tags: [bird-flight, motion-capture, physics-based-control, knn-regression, feather-simulation]
---

## 한 줄 요약

비둘기 모션캡처에서 얻은 소수의 날갯짓을 parameterized wingbeat로 만들고, 시뮬레이션으로 데이터를 불려 k-NN regression 제어기를 학습해 물리 기반 새가 균형을 잡으며 날게 한다.

## 요약

새의 날갯짓은 under-actuated(몸통·깃털에 직접 힘을 줄 수 없음)이고 고차원이며, 새 모션캡처는 협조를 얻기 어려워 데이터가 적고 치우친다. 저자들은 collared dove를 마커 기반 광학 모캡과 고속 카메라로 기록해 골격 움직임과 깃털 변형을 관찰하고, 날갯짓 한 사이클을 평균 reference wingbeat의 scaling·translation·timewarp(29개 파라미터)로 표현한다. 제어기는 날갯짓 주기마다 "목표 상태와 reference 결과 상태의 차이 ΔS → 날갯짓 파라미터 변화 ΔP"를 k-NN regression으로 정한다. 학습 데이터는 두 단계 resampling(PCA 기반 데이터 보강, 실제 제어에 기여하는 샘플 선별과 외삽)으로 만든다. 그 결과 시뮬레이션된 새는 경로 추종, 상호작용 조종, 외란 회복, 깃털이 빠진 상태 비행, 무리 비행까지 하며, 학습 데이터보다 넓은 조향 범위를 보인다.

## 핵심 정리

- **데이터**: 28대 카메라(240fps), 10m×10m×7m 공간, 약 170g 비둘기에 경량 마커 14개. 날갯짓 152 사이클을 정리하고 좌우 반전으로 304개로 늘렸다. 고속 카메라 4대(500~1000fps)로 깃털 휘어짐·비틀림을 관찰했다.
- **모델**: 관절 6개(어깨 3-DOF, 팔꿈치 2-DOF, 손목 1-DOF), 꼬리 2-DOF, unactuated root. 깃털은 primary 10, secondary 8, tail 12개로, 각각 thin shell 삼각형 메시이고 modal warping으로 변형한다. primary는 twist joint와 각 스프링으로 붙어 upstroke에서만 비틀린다.
- **상태·행동**: 상태는 몸통 pitch·roll과 선속도·각속도의 8차원. 행동은 14 DOF × (scale, translation) + timewarp = 29차원. 매 사이클 reference로 한 번 시뮬레이션해 기준 상태 S0을 얻고, ΔS = S_desired − S0에 대해 regression한다.
- **Resampling**: 1단계는 steering α / elevation β 평면을 4×4 bin으로 나누고, bin별·관절별 PCA ellipse(σ = 2~4) 안에서 새 wingbeat를 샘플링한다. 2단계는 제어기를 무작위 과제에 돌려 실제 쓰이는 샘플을 고르고(S자 manifold 관찰), 외삽으로 기동 범위를 넓힌다. 1단계 5,000~20,000개, 최종 1,000~2,000개.
- **시뮬레이션**: ODE 2400Hz, PD servo 추적(ks = 10, kd = 0.002), 폴리곤별 lift/drag. 실제 비행보다 2~3배 느리다.
- **결과**: k-NN이 LWLR, ANN보다 약간 나았다(결정적 증거는 아니라고 명시). 샘플 수는 5,000개까지 성능이 가파르게 오르고, 이웃 0.5%(50/10,000)가 최적. 1단계 제어기의 조향 범위는 −8.02°~8.86°, 2단계 후 −38.17°~29.24°(학습 데이터는 −12.5°~7.0°). 경사 원형 경로는 0°·15° 성공, 30°는 불안정, 45° 실패. 8N 외란까지 견디고 12N에서 추락. primary 깃털 3~4개를 뽑으면 그쪽 방향 선회가 어려워진다.

## 흥미로운 점

- 고차원 행동 공간을 무작정 탐색하지 않고, 모캡이 보여준 "그럴듯한 날갯짓 근처"만 샘플링하는 아이디어. 적은 데이터를 시뮬레이션으로 불리는 방식은 이후 데이터 효율적 제어 연구와 맥이 닿는다.
- 제어 파라미터가 날갯짓 공간에서 저차원 비선형 manifold(S자)를 이룬다는 관찰과, 이를 이용한 외삽.
- 깃털을 하나씩 뽑아 보는 실험처럼, 물리 기반이기 때문에 할 수 있는 "what-if" 검증.

## 한계와 의문

- 실내에서 찍어 느리고 완만한 하강 비행 위주라, 꼬리 각도에 17° bias를 넣어 야외 비행처럼 보정했다. 급상승, 호버링, 곡예 비행은 데이터가 없어서 다루지 못한다.
- 단순화한 공기역학이라 날개 위 난류나 wingtip vortex 같은 현상은 재현하지 못하고, alula·covert feather도 모델에 없다.
- 종마다 날갯짓이 달라서 다른 새로 옮기려면 데이터를 다시 수집하거나 controller adaptation이 필요하다.
- 이후 나온 deep RL 기반 비행 제어와 비교하면 데이터 효율과 기동성 차이가 어느 정도일까?
- 시뮬레이션이 실시간보다 2~3배 느려서, "interactive"라는 표현이 어느 정도의 상호작용을 뜻하는지 확인이 필요하다.

## 나의 한마디
{: .mine-title}

