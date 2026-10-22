---
title: "Two2Four: Generative Quadruped Puppeteering from Human Motion"
short: "Two2Four"
authors: "Fatemeh Zargarbashi, Zehong Qiu, Dhruv Agrawal, Stelian Coros, Robert W. Sumner, Martin Guay, Jakob Buhmann"
venue: "preprint"
year: 2026
field: "Character animation"
topic: "Motion transfer"
approach: "Diffusion 기반"
links:
  paper: ""
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-08-05
tags: [quadruped, motion-retargeting, diffusion, inpainting, puppeteering]
---

## 한 줄 요약

사족보행 동물 데이터로만 학습한 2단계 diffusion 모델에 사람 motion에서 뽑은 feature를 condition(정확히 대응되는 feature)과 inpainting(대략적으로만 대응되는 feature)으로 나눠 넣어, 사람 연기로 개 motion을 자연스럽고 제어 가능하게 만드는 puppeteering 프레임워크.

## 요약

virtual production에서 사람 motion capture로 동물 캐릭터를 움직이려면 동물을 흉내 내는 숙련된 배우나 복잡한 control rig가 필요하다. 이 논문은 사람과 사족보행 동물 사이에 쌍(paired) 데이터가 없다는 점을 피하기 위해, 개 motion data(MANN, 약 40분)만으로 diffusion prior를 학습하고 사람 motion은 추론 시에만 control signal로 쓴다. motion feature를 두 종류로 나눈다: 이동 방향·목표 위치처럼 두 형태 사이에 그대로 옮길 수 있는 precise feature는 학습된 condition으로, 손발 높이·root 높이처럼 대략적인 의미만 있는 imprecise feature는 초반 denoising step에서만 inpainting으로 넣는다. 1단계 trajectory model이 root와 앞발 끝 2개, 총 3개 joint의 궤적을 만들고, 2단계 full-body model이 이를 전신 motion으로 확장한다. 걷기/달리기/점프/앉기/눕기, look-at 제어, 앞다리 puppeteering을 보여 주고, Walk-the-Dog보다 FID와 foot sliding이 낮다고 보고한다.

## 핵심 정리

- 1단계 Trajectory Model: root, 앞다리 끝 2개 joint의 위치 + 6D rotation 궤적을 생성. condition은 T frame 뒤의 sparse 목표(2D root 위치 + yaw)와 이전 context frame. dense 궤적 대신 sparse goal을 쓰는 이유는 생성 자유도를 남겨 realism을 높이기 위해서.
- 2단계 Full-body Model: 1단계 궤적 + head orientation + context frame을 condition으로 전신 joint 위치·회전과 발 contact label을 예측. loss는 reconstruction, FK, foot sliding, condition loss.
- Precise mapping: 사람의 미래 2D root 위치·방향에 scaling factor γ를 곱해 condition으로 넣음. γ를 키우면 사람이 걸어도 개는 달리게 할 수 있음. 머리 방향은 고정 offset으로 매핑.
- Imprecise mapping(inpainting): 초반 80% denoising step 동안만 선택한 성분을 noised reference로 덮어쓰고 이후 해제해 자연스러움을 확보.
  - 앉기/눕기/점프: 사람 root 높이를 dataset 통계(중앙값·최소/최대 높이)로 scale/offset해 개 root 높이로 변환. 의자에 앉기 → 개 앉기, 바닥에 앉기 → 개 눕기로 매핑.
  - root 높이만 inpaint하면 제약이 약해 무시되므로, 점프 시 root 높이 변화를 나머지 joint 높이에도 전파.
  - Limb puppeteer: 사람 손 높이를 선형 변환(s, b)해 앞발 높이로 inpaint.
- 구현: temporal U-Net, 32 frame window + 2 frame context로 autoregressive rollout. DDIM 25 step, 두 단계 합쳐 window당 203 ms(RTX 4090). 온라인 사용 시 latency 0.7 s(미래 목표 0.5 s + 계산 0.2 s).
- 비교: Dog Code, Walk-the-Dog, Motion2Motion과 전문 아티스트 2명의 정성 평가(Table 2). 정량은 HumanLoco 일부로 Walk-the-Dog와 비교 — FID 8.185 vs 14.734, foot sliding 0.076 vs 0.626.
- Ablation: 1단계 없는 single-stage 모델이나 5개 joint를 예측하는 1단계 모델은 inpainting이 잘 먹히지 않음. 예측할 feature가 많을수록 상관된 다른 feature에서 다시 생성해 버리기 때문이라고 해석. full trajectory condition은 제자리 급회전에서 artifact 발생.

## 흥미로운 점

- "정확히 옮길 수 있는 것은 condition, 애매한 것은 high-noise inpainting"으로 나누는 설계가 명확하다. 높은 noise에서는 out-of-domain 신호도 분포 안처럼 보인다는 설명이 설득력 있다.
- 작은 데이터셋(40분)에서는 1단계 표현을 작게 유지해야 inpainting이 통한다는 관찰은 다른 저데이터 동물/생물 motion 생성에도 참고할 만하다.
- 사람이 한 팔을 들면 개가 "손(발) 주기"를 하고, 두 팔을 들면 뒷발로 서는 것처럼 prior가 전신을 맥락에 맞게 보정해 준다.
- guidance나 noise optimization 대신 inpainting을 고른 이유로 계산 비용(실시간 puppeteering)을 든 점.

## 한계와 의문

- 데이터에 뒤로 걷기가 없어 사람이 몇 초 이상 뒤로 걸으면 개가 앉아 버리고 sliding이 생긴다(저자 언급).
- 제어 모드(앉기/점프/puppeteer)와 매핑 파라미터를 사용자가 직접 골라야 한다. 자동 전환은 future work.
- 실험은 개만 다룬다. 다른 사족보행 동물로의 확장은 데이터가 있으면 가능하다고만 주장한다.
- 정량 비교는 Walk-the-Dog 하나뿐이고, 정성 평가는 아티스트 2명의 체크 표시 수준이라 근거가 약하지 않을까?

## 나의 한마디
{: .mine-title}
